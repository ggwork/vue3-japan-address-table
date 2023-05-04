import { http } from '../utils/http';

export function addProduct (data) {
  return http.post('/addProduct', { data: data })
}

// 获取列表

export function getProductApi (data) {
  console.log('getProduct data:', data)
  return http.get('/getProduct', { params: data })
}