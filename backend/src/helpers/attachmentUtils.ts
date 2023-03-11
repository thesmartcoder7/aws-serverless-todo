import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

// DONE: Implement the fileStorage logic
export class AttachmentUtils { 
  constructor(
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
    private readonly S3 = new XAWS.S3({
      signatureVersion: "v4",
    })
  ) {}

  // Create a signed url that allows us to add a new file to the bucket
  createAttachmentPresignedUrl(userId, todoId) {
    // an s3 attachment key is a string that is composed
    // of the user id number and the todo id
    const userNum = userId.replace('google-oauth2|', '')
    return this.S3.getSignedUrl("putObject", {
      Bucket: this.bucketName,
      Key: `${userNum}-todo-${todoId}`,
      Expires: parseInt(this.urlExpiration),
    })
  }
}

