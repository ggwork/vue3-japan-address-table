import { http } from '../utils/http';

export function addProductApi (data) {
  return http.post('/addProduct', { data: data })
}

export function batchAddProductApi (data) {
  return http.post('/batchAddProduct', { data: data })
}


export function updateProductApi (data) {
  console.log('updateProductApi data:', data)
  return http.post('/updateProduct', { data: data })
}


// 获取列表

export function getProductApi (data) {
  console.log('getProduct data:', data)
  return http.get('/getProduct', { params: data })
}

export function deleteProductApi (data) {
  return http.post('/deleteProduct', { data: data })
}
