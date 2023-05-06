import { http } from '../utils/http';

export function addOrderApi (data) {
  return http.post('/addOrder', { data: data })
}

export function getOrderApi (data) {
  return http.get('/getOrder', { params: data })
}

export function deleteOrderApi (data) {
  return http.post('/deleteOrder', { data: data })
}


export function batchUpdateOrderStatusApi (data) {
  // console.log('updateBatchProductApi data:', data)
  return http.post('/batchUpdateOrderStatus', { data: data })
}