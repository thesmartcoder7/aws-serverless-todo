import 'source-map-support/register'
import { S3Handler, S3Event } from 'aws-lambda'
import { addAttachmentUrl } from '../../helpers/todos'

export const handler: S3Handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const key = record.s3.object.key
    console.log('Processing  S3 item with key: ', key)
    
    // an s3 attachment key is a string that is composed
    // of the user id number and the todo id
    const userId = 'google-oauth2|'.concat(
      key.replace(key.substring(key.indexOf('-todo-'), key.length), ''))
    const todoId = key.replace(key.substring(0, key.indexOf('-todo-') + 6), '');
    
    await addAttachmentUrl(key, userId, todoId)
  }
}
