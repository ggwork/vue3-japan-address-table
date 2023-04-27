<template>
  <div class="main">
    <div class="title">{{curMonth}}月小票信息如下</div>
    <div class="tools">
      <div class="t-left">
        
        <el-button type="primary" @click="goForm">新增小票</el-button>
        <el-button class="ml10" type="primary" @click="createOrder">生成订单</el-button>
        <el-button type="primary" @click="startImportExcel">导入小票excel</el-button>
        
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
        <el-table-column prop="product" label="商品" width="300"/>
        <el-table-column prop="num" label="数量" />
        <el-table-column prop="price" label="单价" />
        <el-table-column label="总价">
          <template #default="scope">
            {{ scope.row.num * scope.row.price }}
          </template>
        </el-table-column>
        <el-table-column label="状态" show-overflow-tooltip>
          <template #default="scope">
            <span :class="[scope.row.status ? 'red':'green']">
              {{ statusMap[scope.row.status] }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="uploadFileDialogVisible"
      title="导入小票excel"
      width="30%"
      :before-close="uploadFileDialogClose"
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
  </div>
</template>
<script setup>
import * as XLSX from 'xlsx/xlsx.mjs'
import  { ref } from 'vue'
import { ElMessage,genFileId } from 'element-plus'
import ExcelJS from 'exceljs'


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
    product:'GIアリズﾑコットンブレンﾄﾞセット',
    num:2,
    price:790
  },
  {
    date:'2023-04-26',
    product:'Jounal Standard フラックロングベスト',
    num:1,
    price:10560
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

// Excel结果数组，因为本项目中不同的sheet数据格式一样，因此不同的sheet数据可以合并到一起处理
let excelListResult = []

function tableSelectionChange(sectionData){
  tableSelectionData.value = sectionData
}

function startImportExcel(){
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

async function excelToJson(fileBuffer){
  const excelResult = {};
 
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(fileBuffer);
  // 取第一个数据的第一行进行数据验证，验证通过了再转json。
  let firstSheet = workbook.worksheets[0]
  window.firstSheet = firstSheet
  console.log('firstSheet:',firstSheet)
  let firstRowValues = firstSheet.getRow(0)
  console.log('firstRowValues:',firstRowValues)
  if(!firstRowValues){
    ElMessage.error('Excel数据不能为空')
    return 
  }
  let excelDate = firstRowValues[0]
  return 
  
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
        obj[keys[colNumber-1]] = cell.value
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
  let excelListResult = []
  let keys = Object.key(jsonData)
  keys.each(key=>{
    excelListResult = excelListResult.concat(jsonData[key])
  })
}

// 导入excel
function importExcel(uploadFile,uploadFiles){
  upLoading.value = true
  this.uploadRawFile = uploadFile.raw
  
  let reader = new FileReader();
  reader.onload = async ()=> {
    let excelResult = await excelToJson(reader.result)
    if(excelResult){
      let excelListResult = mergeJsonToArray(excelResult)
      console.log('reader.excelResult:',excelResult);
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
</style>