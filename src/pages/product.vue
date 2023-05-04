<template>
  <div class="main">
    <div class="title">{{curMonth}}月小票信息如下</div>
    <div class="tools">
      <div class="t-left">
        <el-button type="primary" @click="goForm">新增小票</el-button>
        <el-button type="primary" @click="startImportExcel">导入小票excel</el-button>
        <el-button class="ml10" type="primary" @click="createOrder">生成订单</el-button>
      </div>
      <div class="t-right">
        <el-date-picker
          v-model="searchDate"
          type="daterange"
          start-placeholder="请选择开始时间"
          end-placeholder="请选择结束时间"
        />
        <el-select v-model="searchAddress"  placeholder="请选择要查询的地区">
          <el-option
            v-for="item in addressOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button class="btn" type="primary" @click="searchData">查询</el-button>
      </div>
    </div>
    <div class="table-wrap">
      <el-table :data="tableData" style="width: 100%" border highlight-current-row  @selection-change="tableSelectionChange">
        <el-table-column type="selection" width="55" @selectable="checkRowSelectStatus"/>
        <el-table-column prop="date" label="日期"  />
        <el-table-column prop="productName" label="商品" width="300"/>
        <el-table-column prop="num" label="数量" />
        <el-table-column prop="price" label="单价" />
        <el-table-column prop="totalPrice" label="总价" />
        <el-table-column label="状态"
        :filters="[
          { text: '未使用', value: '0' },
          { text: '已使用', value: '1' },
        ]"
        :filter-method="filterStatus"
        >
          <template #default="scope">
            <span :class="[scope.row.status ? 'red':'green']">
              {{ statusMap[scope.row.status] || '未使用' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="editRow(scope.$index, scope.row)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="danger"
              @click="deleteRow(scope.$index, scope.row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
        
      </el-table>
    </div>

    <el-dialog
      v-model="uploadFileDialogVisible"
      title="导入小票excel"
      width="30%"
      :before-close="uploadFileDialogClose"
      :close-on-click-modal = "false"
    >
      <div class="tip mb20 red bold">导入的小票excel应于与模板一致：<a href="https://gg-common.oss-cn-beijing.aliyuncs.com/doc/%E5%B0%8F%E7%A5%A8%E6%A8%A1%E6%9D%BF.xlsx" target="_blank">小票模板</a></div>
      
      
      <el-upload ref="uploadFileRef" type="primary" accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        :limit="1"
        v-model:file-list="uploadExcelList"
        :on-exceed="uploadFileExceed"
        :auto-upload="false"
        :on-change="importExcel" 
        >
        <template #trigger>
          <el-button type="primary" v-loading="upLoading">上传</el-button>
        </template>
        <el-button class="ml10" type="success" @click="submitUpload">
          同步到数据库
        </el-button>
      </el-upload>
    </el-dialog>
    <el-dialog
      v-model="newDialogVisible"
      title="新增小票"
      :close-on-click-modal = "false"
    >
    <el-form ref="proFormRef" :model="newProForm" label-width="120px" class="pro-form" :rules="newPFormRules">
      <el-form-item label="日期" prop="date">
        <el-date-picker
        v-model="newProForm.date"
        type="date"
        placeholder="请选择日期"
        :default-value="proFormDefaultDate"
        value-format="YYYY-MM-DD"
        format="YYYY-MM-DD"
        
      />
      </el-form-item>
      <el-form-item label="商品名" prop="productName">
        <el-input v-model="newProForm.productName" />
      </el-form-item>
      <el-form-item label="商品地区" prop="address">
        <el-select v-model="newProForm.address"  placeholder="请选择地区">
          <el-option
            v-for="item in addressOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="使用状态" prop="status" v-if="editType === 'edit'" :rules="{
        required: true,
        message: '使用状态不能为空',
        trigger: 'blur',
      }">
        <el-select v-model="newProForm.status"  placeholder="请选择状态">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="购买数量" prop="num">
        <el-input v-model="newProForm.num" :parser="value => Number(value)"/>
      </el-form-item>
      <el-form-item label="购买单价" prop="price">
        <el-input v-model="newProForm.price" :parser="value => Number(value)"/>
      </el-form-item>
      <el-form-item label="总价">
        {{ newProForm.num * newProForm.price ?  newProForm.num * newProForm.price : 0}}
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="submitProForm(proFormRef)">提交</el-button>
        <el-button @click="resetProForm(proFormRef)">重置</el-button>
      </el-form-item>
    </el-form>
    </el-dialog>
  </div>
</template>
<script setup>

import  { ref,onMounted } from 'vue'
import { ElMessage,genFileId } from 'element-plus'
import ExcelJS from 'exceljs'
import dayjs from 'dayjs'
import { addProduct,getProductApi } from '@/api/product'

let localFormDefaultDate = localStorage.getItem('localFormDefaultDate') 

let proFormDefaultDate = ref(localFormDefaultDate)

let curMonth = ref('2')
// 查询月份
let searchDate = ref('')
// 查询地址
let searchAddress = ref('')
// 地址列表
let addressOptions = [
  {
    value: '长崎',
    label: '长崎'
  },
  {
    value: '东京',
    label: '东京'
  },
  {
    value: '三重',
    label: '三重'
  }
]
// 查询数据库数据
function searchData(){
  console.log(searchDate.value)
  console.log(searchAddress.value)
}



let statusOptions = [
  {
    value:0,
    label:'未使用'
  },
  {
    value:1,
    label:'已使用'
  }
]


let statusMap = {
  0:'未使用',
  1:'已使用',
}

let tableSelectionData = ref()

// 决定该列是否可以被选中
function checkRowSelectStatus(row){
  return !row.status
}

let tableData = ref([
  {
    date:'2023-04-26',
    productName:'GIアリズﾑコットンブレンﾄﾞセット',
    num:2,
    price:790,
    totalPrice:790
  }
])

let uploadExcelList = ref([])
// 上传的文件
let uploadRawFile = ref()
// 上传组件ref 
let uploadFileRef = ref()

// 上传文件弹窗
let uploadFileDialogVisible = ref(false)

let hasUploadToServer = ref(false)

let upLoading = ref(false)

// 新增小票
let newDialogVisible = ref(false)

let editType = ref('edit')

// 新增小票表单

function validateNumber(rulr,value,callback){
  if(/^\d+(\.\d+)?$/.test(value)){
    callback()
  }else {
    callback(new Error('输入必须是数字'))
  }
}
let newProForm = ref({
  date:localFormDefaultDate,
  productName:'',
  address:'',
  status:0,
  num:'',
  price:''
})
let newPFormRules = {
  date: [{ required: true, message: '日期不能为空', trigger: 'blur' }],
  productName: [
    { required: true, message: '商品名不能为空', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '地区不能为空', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '商品使用状态不能为空', trigger: 'blur' }
  ],
  num: [
    { required: true, message: '数量不能为空' },  
    { validator: validateNumber, trigger: 'blur' }
  ],
  price:[
    { required: true, message: '价格不能为空' },  
    { validator: validateNumber, trigger: 'blur' }
  ],
}

// console.log('localFormDefaultDate:',localFormDefaultDate);
// let defaultDate = localFormDefaultDate && localFormDefaultDate!=='undefined' ? new Date(localFormDefaultDate) : new Date()




let proFormRef = ref()

function resetNewProForm(){
  newProForm.value = {
    date:localFormDefaultDate,
    productName:'',
    address:'',
    status:0,
    num:'',
    price:''
  }
}

function goForm() {
  editType.value = 'new'
  newDialogVisible.value = true
  resetNewProForm()
}


async function getProductList(){
  let res = await getProductApi({
    startDate:searchDate.value[0],
    endDate:searchDate.value[1],
    searchAddress:searchAddress.value
  })
  console.log('getProductList res:',res)
  if(res){
    tableData.value = res
  }
}

function submitProForm(formEl){
  if (!formEl) return
  formEl.validate(async (valid) => {
    if (valid) {
      console.log('form')
      localStorage.setItem('localFormDefaultDate',newProForm.value.date)
      newDialogVisible.value = false
      await addProduct(newProForm.value)
      ElMessage.success('新增成功')

      getProductList()

      
      resetProForm()

    } else {
      
      return false
    }
  })
}

function  resetProForm(formEl) {
  if (!formEl) return
  formEl.clearValidate()
  formEl.resetFields()
}





function tableSelectionChange(sectionData){
  tableSelectionData.value = sectionData
}

function startImportExcel(){
  uploadFileRef.value?.clearFiles()
  uploadFileDialogVisible.value = true
  hasUploadToServer.value = true
}
// 同步上传的小票数据到数据库
function submitUpload(){
  uploadFileDialogVisible.value = false
  hasUploadToServer.value = false
}
// 询问是否关闭弹窗
function uploadFileDialogClose(done){
  if(hasUploadToServer.value){
    done()
  }else{
    ElMessageBox.confirm('文件还未同步到数据库，请确认是否关闭','提示',{
      confirmButtonText: '关闭',
      cancelButtonText: '否',
      type: 'warning',
    })
    .then(() => {
      done()
    })
    .catch(() => {
      // catch error
    })
  }
  
}

// 根据cell的类型获取cell的值
/**
 * 
 *  
 */
function getCellValue(cell) {
  if(cell.type ===ExcelJS.ValueType.Null){
    return ''
  }else if (cell.type === ExcelJS.ValueType.Number || cell.type === ExcelJS.ValueType.String || cell.type === ExcelJS.ValueType.Boolean){
    return cell.value
  }else if (cell.type === ExcelJS.ValueType.Date){
    return dayjs(cell.value).format('YYYY-MM-DD')
  }else if (cell.type === ExcelJS.ValueType.Hyperlink){
    return  cell.value.text
  }else if (cell.type === ExcelJS.ValueType.Formula || cell.type === ExcelJS.ValueType.SharedString){
    return  cell.value.result
  }else if (cell.type === ExcelJS.ValueType.Error){
    return cell.value.error
  }else if(cell.type === ExcelJS.ValueType.RichText){
    return  cell.text
  }
}

async function excelToJson(fileBuffer){
  const excelResult = {};
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  // 取第一个数据的第一行进行数据验证，验证通过了再转json。
  let firstSheet = workbook.worksheets[0]
  
  // 获取第一个单元格数据
  let firstCellValue = getCellValue(firstSheet.getCell('A1')) ;
  if(!/^[1-2][0-9][0-9][0-9]-[0-1]{0,1}[0-9]-[0-3]{0,1}[0-9]$/.test(firstCellValue)){
    ElMessage.error('表格第一列应为日期，且格式为YYYY-MM-DD')
    return 
  }
  
  workbook.eachSheet((worksheet,sheetId)=>{
    let sheetResult = []
    // 默认excel内容里是没有标题的，标题是固定的以下几个
    let keys=['date','productName','num','price','totalPrice'];
    worksheet.eachRow((row)=> {
      let obj={};
      // cell.type单元格类型：6-公式 ;2-数值；3-字符串
      // rowNumber 为1的时候是标题
      // if(rowNumber === 1) {
      //   row.eachCell((cell, colNumber)=>{
      //     const value = cell.value;
      //     if(keys.includes(value)){
      //       keys.push(value+'_'+colNumber);
      //     }else {
      //       keys.push(value);
      //     }
      //   });
      // }else {
      //   row.eachCell((cell, colNumber)=>{
      //     obj[keys[colNumber-1]] = cell.value
      //   });
      //   sheetResult.push(obj)
      // }
      row.eachCell((cell, colNumber)=>{
        obj[keys[colNumber-1]] = getCellValue(cell)
      });
      sheetResult.push(obj)
    });
    excelResult[sheetId] = sheetResult
  })
  
  
  // console.log('excelResult:',excelResult)
  return excelResult
} 
// 将不同的sheet数据合并到一个数据中处理
function mergeJsonToArray(jsonData) {
  console.log('jsonData:',jsonData)
  let excelListResult = []
  let keys = Object.keys(jsonData)
  keys.forEach(key=>{
    excelListResult = excelListResult.concat(jsonData[key])
  })
  return excelListResult
}

// 导入excel
function importExcel(uploadFile,uploadFiles){
  upLoading.value = true
  this.uploadRawFile = uploadFile.raw
  
  let reader = new FileReader();
  reader.onload = async ()=> {
    let excelResult = await excelToJson(reader.result)
    if(excelResult){
      let excelArrayResult = mergeJsonToArray(excelResult)
      
      tableData.value = excelArrayResult
    }else {
      console.log('excelToJson excelResult:',excelResult)
    }
  }
  reader.readAsArrayBuffer(uploadFile.raw);
  upLoading.value = false
}

function uploadFileExceed(files){
  uploadFileRef.value.clearFiles()
  const file = files[0]
  file.uid = genFileId()
  uploadFileRef.value.handleStart(file)
}


// 生成订单
function createOrder(){
  console.log('生成订单')
}

function filterStatus(value,row,column){
  const property = column['property']
  return row[property] === value
}

function editRow(index,row){
  console.log('row:',row)
  editType.value = 'edit'
  newDialogVisible.value = true
  newProForm.value = row
  
}

function deleteRow(index,row){

}


onMounted(()=>{
  getProductList()
})






</script>
<style lang="scss" scoped>
.tools{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 0px;
  .t-left{
    display: flex;
    align-items: center;
    .el-upload{
      margin-right: 10px;
      display: flex;
      align-items: center;
    }
    .el-button{
      margin-right: 10px;
    }
  }
  .t-right{
    display: flex;
    align-items: center;

    .el-date-picker{
      margin-left: 10px;
    }
    .el-select{
      margin-left: 10px;
    }
    .el-button{
      margin-left: 10px;
    }
  }
}
.table-wrap{
  margin-top: 20px;
}
.pro-form{
  width:400px
}
</style>