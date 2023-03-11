import { TodoAccess } from './todosAccess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
import * as createError from 'http-errors'

const logger = createLogger('Todos')

// DONE: Implement businessLogic
const todoAccess = new TodoAccess()
const attachmentUtils = new AttachmentUtils()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
  logger.info(`Getting todos for user: ${userId}`)
  return await todoAccess.getTodosForUser(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  logger.info('Creating a new todo item for user: ', userId)
  
  const itemId = uuid.v4()
  return await todoAccess.createTodo({
    userId,
    todoId: itemId,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    createdAt: new Date().toISOString()
  })
}

export async function updateTodo(
  updateTodoRequest: UpdateTodoRequest,
  userId: string,
  todoId: string
) {
  logger.info(`Updating todo item ${todoId} for user: ${userId}`)
  
  const result = await todoAccess.updateTodo({
    name: updateTodoRequest.name,
    dueDate: updateTodoRequest.dueDate,
    done: updateTodoRequest.done,
  }, userId, todoId)
  
  if (result === "Not Found") {
    throw new createError.NotFound()
  } 
  else if (result !== "Success") {
    throw createError(500, result)
  } else logger.info(`Todo Successfully Updated`)
}

export async function deleteTodo(
  userId: string,
  todoId: string
) {
  logger.info(`Deleting todo item ${todoId} for user: ${userId}`)
  
  const result = await todoAccess.deleteTodo(userId, todoId)
  if (result === "Not Found") {
    throw new createError.NotFound()
  } 
  else if (result !== "Success") {
    throw createError(500, result)
  } else logger.info(`Todo Successfully deleted`)
}


export async function createAttachmentPresignedUrl(userId: string, todoId: string) {
  logger.info(`Getting a presigned url to add image to todo item ${todoId} for user: ${userId}`)
  
  if (!todoAccess.todoExistsInDb(userId, todoId)) {
    throw new createError.NotFound()
  }
  return await attachmentUtils.createAttachmentPresignedUrl(userId, todoId)
}

export async function addAttachmentUrl(key: string, userId: string, todoId: string) {
  logger.info(`Adding an attachment url to todo item ${todoId} for user: ${userId}`)
  
  const result = await todoAccess.addAttachmentUrl(key, userId, todoId)
  if (result === 'Not Found') {
    logger.error(`Cannot add attachment url to non existing Todo item`)
  }
  else logger.info(`Successfully added attachment url to Todo item ${todoId}`)
}

