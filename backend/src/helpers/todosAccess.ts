import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import * as createError from 'http-errors'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// DONE: Implement the dataLayer logic
export class TodoAccess {

  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET
  ) {}
  
  async getTodosForUser(userId: string): Promise<TodoItem[]> {
    
    const result = await this.docClient
    .query({
      TableName: this.todosTable,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId,
      },
      ScanIndexForward: false, // reverse sort order
    }).promise()

    const items = result.Items
    return items as TodoItem[]
  }
  
  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient.put({
      TableName: this.todosTable,
      Item: todo
    }).promise()

    return todo
  }
  
  // Delete a todo item that was created by the user 
  async deleteTodo(userId: string, todoId: string) : Promise<string> {
    try {  
      const todoDoesExist = this.todoExistsInDb(userId, todoId)
      
      if (!todoDoesExist) {
        return "Not Found"
      }
    
      await this.docClient.delete({
        TableName: this.todosTable,
        Key: {
          "userId": userId,
          "todoId": todoId
        },
      }).promise()
      return "Success"
    } catch (e) {
      return JSON.stringify(e)
    }
  }
  
  // Update a todo item that was created by the user
  async updateTodo(todo: TodoUpdate, userId: string, todoId: string): Promise<string> {
    //DONE: send update request to todosTable
    try {
      const todoDoesExist = this.todoExistsInDb(userId, todoId)
      
      if (!todoDoesExist) {
        return "Not Found"
      }
   
    //DONE: CONFIGURE UPDATE REQUEST
      await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          "userId": userId,
          "todoId": todoId
        },
        UpdateExpression: 'SET #name = :name, #dueDate = :dueDate, #done = :done',
        ExpressionAttributeNames: {
          "#name": "name",
          "#dueDate": "dueDate",
          "#done": "done"
        },
        ExpressionAttributeValues: {
          ":name": todo.name,
          ":dueDate": todo.dueDate,
          ":done": todo.done
        }
      }).promise()
      return "Success"
    } catch (e) {
      return JSON.stringify(e)
    }
  }
  
  async addAttachmentUrl(key: string, userId: string, todoId: string) {
    try {
      const todoDoesExist = this.todoExistsInDb(userId, todoId)
      
      if (!todoDoesExist) {
        return "Not Found"
      }
      
      const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`
      
      await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          "userId": userId,
          "todoId": todoId
        },
        UpdateExpression: 'SET #attachmentUrl = :attachmentUrl',
        ExpressionAttributeNames: {
          "#attachmentUrl": "attachmentUrl"
        },
        ExpressionAttributeValues: {
          ":attachmentUrl": attachmentUrl
        }
      }).promise()
      return "Success"
    } catch (e) {
      return JSON.stringify(e)
    }
  }
  
  async todoExistsInDb(userId: string, todoId: string) {
    try {
      const result = await this.docClient
        .get({
          TableName: this.todosTable,
          Key: {
            userId,
            todoId
          },
        }).promise()
      
      if (!result.Item) {
        logger.info(`No Todo item with id ${todoId} created by user ${userId} was found in Dynamodb`)
        return false
      }
      return true 
      
    } catch (e) {
      throw createError(500, JSON.stringify(e))
    }
  }
}


function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}

