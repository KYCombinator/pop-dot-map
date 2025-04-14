import { S3Client, paginateListObjectsV2 } from '@aws-sdk/client-s3';

const s3Config = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: 'us-east-2',
};

const bucket = 'censusawsbucket';

// get all files in our s3 bucket
const getAllS3Files = async (client, s3Opts) => {
  const totalFiles = [];
  for await (const data of paginateListObjectsV2({ client }, s3Opts)) {
    totalFiles.push(...(data.Contents || []));
  }
  return totalFiles;
};

// groups urls based on the first part of the key, in form: "{year}_Census_Year". will create url for 
// each item with that year's prefix
const groupUrlsByYear = (urlsGroupedByYear, file) => {
  const fileKey = file.Key;

  // skip folders
  if (fileKey.endsWith("/")) return;

  // skips empty images
  if (file.Size < 855) return;

  const keySplit = fileKey.split("/");
  const folderName = keySplit[0];

  // if we dont already have array for that year, make an empty one
  if (!urlsGroupedByYear[folderName]) {
    urlsGroupedByYear[folderName] = [];
  }

  urlsGroupedByYear[folderName].push({
    url: `https://${bucket}.s3.${s3Config.region}.amazonaws.com/${folderName}/${keySplit[1]}`,
  });
};

// calls our other functions to access all items in s3 bucket and then group each one by year, 
// returns object where each key is the name of the folder for each year, and the associated 
// value is array of every url for images for that year 
export async function GET() {
  try {
    const client = new S3Client(s3Config);
    const s3Opts = { Bucket: bucket };
    const files = await getAllS3Files(client, s3Opts);

    const urlsGroupedByYear = {};

    files.forEach((file) => groupUrlsByYear(urlsGroupedByYear, file));

    return new Response(JSON.stringify(urlsGroupedByYear), {
      status: 200
    });
  } catch (err) {
    console.error('Error getting files from S3! : ', err);
    return new Response(JSON.stringify({ error: 'Failed to get image urls' }), {
      status: 500,
    });
  }
}