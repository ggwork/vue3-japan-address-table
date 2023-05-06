<template>
  <div class="main">
    <div class="title">{{ curMonth }}月小票信息如下</div>
    <div class="tools">
      <div class="t-left">
        <el-button type="primary" @click="goForm">新增小票</el-button>
        <el-button type="primary" @click="startImportExcel">导入小票excel</el-button>
        <el-button class="ml10" type="primary" @click="createOrder">生成订单</el-button>
      </div>
      <div class="t-right">
        <el-date-picker v-model="searchDate" type="daterange" start-placeholder="请选择开始时间" end-placeholder="请选择结束时间"
          value-format="YYYY-MM-DD" format="YYYY-MM-DD" />
        <el-select v-model="searchAddress" placeholder="请选择要查询的地区" clearable>
          <el-option v-for="item in addressOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button class="btn" type="primary" @click="searchData">查询</el-button>
      </div>
    </div>
    <div class="table-wrap">
      <el-table :data="tableData" style="width: 100%" border  ref="productTableRef" highlight-current-row
        @selection-change="tableSelectionChange">
        <el-table-column type="selection" width="55" @selectable="checkRowSelectStatus" />
        <el-table-column prop="date" label="日期" />
        <el-table-column prop="productName" label="商品" width="300" />
        <el-table-column prop="num" label="数量" />
        <el-table-column prop="price" label="单价" />
        <el-table-column prop="totalPrice" label="总价" />
        <el-table-column label="状态" :filters="[
            { text: '未使用', value: 0 },
            { text: '已使用', value: 1 },
          ]" :filter-method="filterStatus">
          <template #default="scope">
            <span :class="[scope.row.status ? 'red' : 'green']">
              {{ statusMap[scope.row.status] || "未使用" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地区" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="editRow(scope.$index, scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteRow(scope.$index, scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="page-wrap" v-if="totalListNum">
      <el-pagination background layout="total,sizes,prev, pager, next,jumper" :total="totalListNum"
        :page-sizes="[10, 20, 50, 100]" v-model:page-size="pageSize" v-model:current-page="currentPage"
        @size-change="pageSizeChange" @current-change="pageCurrentChange" />
    </div>

    <el-dialog v-model="uploadFileDialogVisible" title="导入小票excel" width="30%" :before-close="uploadFileDialogClose"
      :close-on-click-modal="false">
      <div class="tip mb20 red bold">
        导入的小票excel应于与模板一致：<a
          href="https://gg-common.oss-cn-beijing.aliyuncs.com/doc/%E5%B0%8F%E7%A5%A8%E6%A8%A1%E6%9D%BF.xlsx"
          target="_blank">小票模板</a>
      </div>

      <el-upload ref="uploadFileRef" type="primary"
        accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :limit="1"
        v-model:file-list="uploadExcelList" :on-exceed="uploadFileExceed" :auto-upload="false" :on-change="uploadExcel">
        <template #trigger>
          <el-button type="primary" v-loading="upLoading">上传</el-button>
        </template>
        <el-button class="ml10" type="success" @click="submitUploadExcel" :disabled="!canSyncToDb">
          同步到数据库
        </el-button>
      </el-upload>
    </el-dialog>
    <el-dialog v-model="newDialogVisible" title="新增小票" :close-on-click-modal="false">
      <el-form ref="proFormRef" :model="newProForm" label-width="120px" class="pro-form" :rules="newPFormRules">
        <el-form-item label="日期" prop="date">
          <el-date-picker v-model="newProForm.date" type="date" placeholder="请选择日期" :default-value="proFormDefaultDate"
            value-format="YYYY-MM-DD" format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="商品名" prop="productName">
          <el-input v-model="newProForm.productName" />
        </el-form-item>
        <el-form-item label="商品地区" prop="address">
          <el-select v-model="newProForm.address" placeholder="请选择地区">
            <el-option v-for="item in addressOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用状态" prop="status" v-if="editType === 'edit'" :rules="{
            required: true,
            message: '使用状态不能为空',
            trigger: 'blur',
          }">
          <el-select v-model="newProForm.status" placeholder="请选择状态">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="购买数量" prop="num">
          <el-input v-model="newProForm.num" :parser="(value) => Number(value)" @change="changeTotalPrice" />
        </el-form-item>
        <el-form-item label="购买单价" prop="price">
          <el-input v-model="newProForm.price" :parser="(value) => Number(value)" @change="changeTotalPrice" />
        </el-form-item>
        <el-form-item label="总价">
          {{
            newProForm.num * newProForm.price
            ? newProForm.num * newProForm.price
            : 0
          }}
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitProForm(proFormRef)">提交</el-button>
          <el-button @click="resetProForm(proFormRef)">重置</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
    <el-dialog v-model="orderDialogVisible" title="创建订单" :close-on-click-modal="false">
      <el-form ref="orderFormRef" :model="orderForm" label-width="120px" class="pro-form" :rules="orderFormRules">
        <el-form-item label="顧客ID" prop="customerId">
          <el-input v-model="orderForm.customerId" placeholder="请输入顧客ID" />
        </el-form-item>
        <el-form-item label="顧客名" prop="customerName">
          <el-input v-model="orderForm.customerName" placeholder="请输入顧客名" />
        </el-form-item>
        <el-form-item label="顧客手机" prop="customerPhone">
          <el-input v-model.number="orderForm.customerPhone" placeholder="请输入顧客手机号" />
        </el-form-item>
        <el-form-item label="郵送先" prop="getAddress">
          <el-input type="textarea" :rows="2" v-model.trim="orderForm.getAddress" placeholder="请输入郵送先" />
        </el-form-item>
        <el-form-item label="代金受領日" prop="getDate">
          <el-date-picker v-model="orderForm.getDate" type="date" placeholder="请选择日期" 
            value-format="YYYY-MM-DD" format="YYYY-MM-DD" />
        </el-form-item>
        
        <el-form-item label="商品列表" prop="proList">
          <el-tag
            v-for="tag in orderForm.proList"
            :key="tag.productName"
            class="mb10 mr10"
            type="success"
          >
            {{ tag.productName + '【' + tag.address +'】'}}
          </el-tag>
        </el-form-item>
        <el-form-item label="発送日" prop="sendDate">
          <el-date-picker v-model="orderForm.sendDate" type="date" placeholder="请选择日期" 
            value-format="YYYY-MM-DD" format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="合計金額（元）" prop="totalMoneyChina">
          <el-input v-model="orderForm.totalMoneyChina" placeholder="请输入合计金额"  @change="changeOrderTotalMoney" />
        </el-form-item>
        <el-form-item label="為替レート）" prop="rate">
          <el-input v-model="orderForm.rate" placeholder="请输入為替レート" @change="changeRate"/>
        </el-form-item>
        <el-form-item label="合計金額（円）" prop="totalMoneyJapan">
          <el-input v-model="orderForm.totalMoneyJapan" placeholder="请输入合计金额"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitOrderForm(orderFormRef)">提交</el-button>
          <el-button @click="cancelOrderForm(orderFormRef)">取消</el-button>
          <el-button @click="changeCustomer">切换用户</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox, genFileId } from "element-plus";
import ExcelJS from "exceljs";
import dayjs from "dayjs";
import {
  addProductApi,
  getProductApi,
  updateProductApi,
  deleteProductApi,
  batchAddProductApi,
  getCustomerList,
  batchUpdateProductStatusApi
} from "@/api/product";

import { addOrderApi } from "@/api/order";

let localFormDefaultDate = localStorage.getItem("localFormDefaultDate");

let proFormDefaultDate = ref(localFormDefaultDate);

let curMonth = ref("2");
// 查询月份
let searchDate = ref("");
// 查询地址
let searchAddress = ref("");
// 地址列表
let addressOptions = [
  {
    value: "长崎",
    label: "长崎",
  },
  {
    value: "东京",
    label: "东京",
  },
  {
    value: "三重",
    label: "三重",
  },
];

let productTableRef = ref()

let canSyncToDb = ref(false);
// 查询数据库数据
async function searchData () {
  let queryObj = { cPage: currentPage.value, pageSize: pageSize.value };
  if (searchDate.value) {
    queryObj.startDate = searchDate.value[0];
    queryObj.endDate = searchDate.value[1];
  }
  if (searchAddress.value) {
    queryObj.address = searchAddress.value;
  }
  let res = await getProductApi(queryObj);
  // console.log('res:',res)
  tableData.value = res.list;
  totalListNum.value = res.totalNum;
}

let statusOptions = [
  {
    value: 0,
    label: "未使用",
  },
  {
    value: 1,
    label: "已使用",
  },
];

let statusMap = {
  0: "未使用",
  1: "已使用",
};

let tableSelectionData = ref();

// 决定该列是否可以被选中
function checkRowSelectStatus (row) {
  return !row.status;
}

let tableData = ref([]);

let uploadExcelList = ref([]);
// 上传的文件
let uploadRawFile = ref();
// 上传组件ref
let uploadFileRef = ref();

// 上传文件弹窗
let uploadFileDialogVisible = ref(false);

let hasUploadToServer = ref(false);

let upLoading = ref(false);

// 新增小票
let newDialogVisible = ref(false);

let editType = ref("edit");

// 分页相关
let totalListNum = ref();
let pageSize = ref(10);

let currentPage = ref(1);

let orderDialogVisible = ref(false);

function pageSizeChange (pageSize) {
  currentPage.value = 1;
  // console.log('pageCurrentChange pageSize:',pageSize)
  getProductList();
}
function pageCurrentChange (num) {
  // console.log('pageCurrentChange num:',num)

  getProductList();
}

// 新增小票表单

function validateNumber (rulr, value, callback) {
  if (/^\d+(\.\d+)?$/.test(value) || value === '') {
    callback();
  } else {
    callback(new Error("必须是数字"));
  }
}
let newProForm = ref({
  date: localFormDefaultDate,
  productName: "",
  address: "",
  status: 0,
  num: "",
  price: "",
});
let newPFormRules = {
  date: [{ required: true, message: "日期不能为空", trigger: "blur" }],
  productName: [
    { required: true, message: "商品名不能为空", trigger: "blur" },
    { min: 1, max: 100, message: "商品名不能超过100个字符" },
  ],
  address: [{ required: true, message: "地区不能为空", trigger: "blur" }],
  status: [
    { required: true, message: "商品使用状态不能为空", trigger: "blur" },
  ],
  num: [
    { required: true, message: "数量不能为空" },
    { validator: validateNumber, trigger: "change" },
  ],
  price: [
    { required: true, message: "价格不能为空" },
    { validator: validateNumber, trigger: "change" },
  ],
};
let customerList = ref([])
// 订单表单
let orderForm = ref({
  customerId: "",
  customerName: "",
  customerPhone: "",
  sendDate: "",
  proList: [],
  totalMoneyChina: "",
  rate: "",
  totalMoneyJapan: "",
  getDate: "",
  getAddress: "",
  status: 0,
});

let orderFormRules = {
  customerId: [
    { required: true, message: "顾客id不能为空", trigger: "blur" }
  ],
  customerName: [
    { required: true, message: "顾客姓名不能为空", trigger: "blur" },
  ],
  customerPhone: [
    { required: true, message: "顾客手机号不能为空", trigger: "blur" },
  ],
  getAddress: [
    {
      type: "string",
      required: true,
      message: "郵送先不能为空",
      trigger: "blur",
    },
  ],
  getDate: [
    {
      type: "date",
      required: true,
      message: "代金受領日不能为空且必须是日期",
      trigger: "blur",
    },
  ],
  sendDate: [
    {
      type: "date",
      required: false,
      message: "发送日的格式不正确",
      trigger: "blur",
    },
  ],
  // proList: [
  //   {
  //     type: "array",
  //     required: true,
  //     message: "产品列表参数必须是数组",
  //     trigger: "change",
  //   },
  // ],
  totalMoneyChina: [
    { validator: validateNumber, trigger: "change" },
  ],
  rate: [
    { required: false, message: "数量不能为空" },
    { validator: validateNumber, trigger: "change" },
  ],
  totalMoneyJapan: [
    { required: false, message: "数量不能为空" },
    { validator: validateNumber, trigger: "change" },
  ],
  
  
  status: [
    {
      type: "number",
      required: true,
      message: "状态不能为空",
      trigger: "blur",
    },
  ],
};

// console.log('localFormDefaultDate:',localFormDefaultDate);
// let defaultDate = localFormDefaultDate && localFormDefaultDate!=='undefined' ? new Date(localFormDefaultDate) : new Date()

let proFormRef = ref();
let orderFormRef = ref();

function resetNewProForm () {
  newProForm.value = {
    date: localFormDefaultDate,
    productName: "",
    address: "",
    status: 0,
    num: "",
    price: "",
  };
}

function changeTotalPrice () {
  newProForm.value.totalPrice =
    Number(newProForm.value.num) * Number(newProForm.value.price);
}

function goForm () {
  editType.value = "new";
  newDialogVisible.value = true;
  resetNewProForm();
}

async function getProductList () {
  let res = await getProductApi({
    startDate: searchDate.value[0],
    endDate: searchDate.value[1],
    searchAddress: searchAddress.value,
    cPage: currentPage.value,
    pageSize: pageSize.value,
  });
  if (res) {
    tableData.value = res.list;
    totalListNum.value = res.totalNum;
  }
}

function submitProForm (formEl) {
  if (!formEl) return;
  formEl.validate(async (valid) => {
    if (valid) {
      localStorage.setItem("localFormDefaultDate", newProForm.value.date);

      let editTypeMsg = editType.value === "new" ? "新增" : "更新";
      if (editType.value === "new") {
        await addProductApi(newProForm.value);
      } else {
        let res = await updateProductApi(newProForm.value);
        console.log("res:", res);
      }
      ElMessage.success(editTypeMsg + "成功");
      getProductList();
      resetProForm();
      newDialogVisible.value = false;
    } else {
      return false;
    }
  });
}

function resetProForm (formEl) {
  if (!formEl) return;
  formEl.clearValidate();
  formEl.resetFields();
}

function changeOrderTotalMoney(value){
  console.log('changeOrderTotalMoney value:',value)
  ElMessageBox.confirm('修改合计金额可能会导致实际商品总价与修改不一致，请谨慎操作', '提示', {
    // if you want to disable its autofocus
    // autofocus: false,
    confirmButtonText: '确定修改',
    cancelButtonText: '取消修改',
    type: 'warning',
  }).then(()=>{
    orderForm.value.totalMoneyJapan = Number(orderForm.value.rate) * Number(orderForm.value.totalMoneyChina)
  }).catch(()=>{
    let totalMoneyChina = 0
    orderForm.value.proList.forEach(item=>{
      totalMoneyChina += Number(item.num) * Number(item.price)
    })
    orderForm.value.totalMoneyChina = Number(totalMoneyChina)
  })
  
}

function changeRate(){
  orderForm.value.totalMoneyJapan = Number(orderForm.value.rate) * Number(orderForm.value.totalMoneyChina)
}


function submitOrderForm(formEl) {
  if (!formEl) return;
  formEl.validate(async (valid) => {
    if (valid) {
      
      await addOrderApi(orderForm.value)
      // 更新商品状态
      let productStatus = orderForm.value.proList.map(item=>{
        return {
          _id:item._id,
          status:1
        }
      })
      await batchUpdateProductStatusApi({
        list:productStatus
      })
      // 更新状态
      tableSelectionData.value.forEach(item=>{
        item.status = 1
      })
      
      orderDialogVisible.value = false
      ElMessage.success('订单生成成功，请前往订单页查看')
      if(productTableRef.value){
        productTableRef.value.clearSelection()
      }
    }
  })

}

function  cancelOrderForm(formEl) {
  if (!formEl) return;
  orderDialogVisible.value = false
  formEl.resetFields()
}

function tableSelectionChange (sectionData) {
  tableSelectionData.value = sectionData;
}

function startImportExcel () {
  uploadFileRef.value?.clearFiles();
  uploadFileDialogVisible.value = true;
  hasUploadToServer.value = true;
  canSyncToDb.value = false;
}
// 同步上传的小票数据到数据库
async function submitUploadExcel () {
  if (tableData.value) {
    uploadFileDialogVisible.value = false;
    hasUploadToServer.value = false;
    await batchAddProductApi({ list: tableData.value });
    ElMessage.success("数据导入成功");
    getProductList();
  } else {
    ElMessage.error("数据为空");
  }
}
// 询问是否关闭弹窗
function uploadFileDialogClose (done) {
  if (hasUploadToServer.value) {
    done();
  } else {
    ElMessageBox.confirm("文件还未同步到数据库，请确认是否关闭", "提示", {
      confirmButtonText: "关闭",
      cancelButtonText: "否",
      type: "warning",
    })
      .then(() => {
        done();
      })
      .catch(() => {
        // catch error
      });
  }
}

// 根据cell的类型获取cell的值
/**
 *
 *
 */
function getCellValue (cell) {
  if (cell.type === ExcelJS.ValueType.Null) {
    return "";
  } else if (
    cell.type === ExcelJS.ValueType.Number ||
    cell.type === ExcelJS.ValueType.String ||
    cell.type === ExcelJS.ValueType.Boolean
  ) {
    return cell.value;
  } else if (cell.type === ExcelJS.ValueType.Date) {
    return dayjs(cell.value).format("YYYY-MM-DD");
  } else if (cell.type === ExcelJS.ValueType.Hyperlink) {
    return cell.value.text;
  } else if (
    cell.type === ExcelJS.ValueType.Formula ||
    cell.type === ExcelJS.ValueType.SharedString
  ) {
    return cell.value.result;
  } else if (cell.type === ExcelJS.ValueType.Error) {
    return cell.value.error;
  } else if (cell.type === ExcelJS.ValueType.RichText) {
    return cell.text;
  }
}

async function excelToJson (fileBuffer) {
  const excelResult = {};
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  // 取第一个数据的第一行进行数据验证，验证通过了再转json。
  let firstSheet = workbook.worksheets[0];

  console.log("firstSheet:", firstSheet);

  // 获取第一个单元格数据
  let firstCellValue = getCellValue(firstSheet.getCell("A1"));
  if (
    !/^[1-2][0-9][0-9][0-9]-[0-1]{0,1}[0-9]-[0-3]{0,1}[0-9]$/.test(
      firstCellValue
    )
  ) {
    ElMessage.error("表格第一列应为日期，且格式为YYYY-MM-DD");
    return;
  }

  workbook.eachSheet((worksheet, sheetId) => {
    let sheetResult = [];
    // 默认excel内容里是没有标题的，标题是固定的以下几个
    let keys = [
      "date",
      "productName",
      "num",
      "price",
      "totalPrice",
      "address",
      "status",
    ];
    worksheet.eachRow((row) => {
      let obj = {};
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
      row.eachCell((cell, colNumber) => {
        let oKey = keys[colNumber - 1];

        obj[oKey] = getCellValue(cell);
      });
      obj["address"] = worksheet.name;
      obj["status"] = 0;
      // 如果总价不存在，则总价计算总价
      if (!obj["totalPrice"]) {
        obj["totalPrice"] = Number(obj["num"]) * Number(obj["price"]);
      }
      sheetResult.push(obj);
    });
    excelResult[sheetId] = sheetResult;
  });

  // console.log('excelResult:',excelResult)
  return excelResult;
}
// 将不同的sheet数据合并到一个数据中处理
function mergeJsonToArray (jsonData) {
  let excelListResult = [];
  let keys = Object.keys(jsonData);
  keys.forEach((key) => {
    excelListResult = excelListResult.concat(jsonData[key]);
  });
  return excelListResult;
}

// 导入excel
function uploadExcel (uploadFile, uploadFiles) {
  upLoading.value = true;
  this.uploadRawFile = uploadFile.raw;

  let reader = new FileReader();
  reader.onload = async () => {
    let excelResult = await excelToJson(reader.result);
    if (excelResult) {
      let excelArrayResult = mergeJsonToArray(excelResult);

      tableData.value = excelArrayResult;
      // 将数据同步到数据库

      canSyncToDb.value = true;
    } else {
      console.log("excelToJson excelResult:", excelResult);
    }
  };
  reader.readAsArrayBuffer(uploadFile.raw);
  upLoading.value = false;
}

function uploadFileExceed (files) {
  uploadFileRef.value.clearFiles();
  const file = files[0];
  file.uid = genFileId();
  uploadFileRef.value.handleStart(file);
}
// m,n  不包括n
function randomNum(m,n){
  return Math.floor(Math.random() * (n-m) + m)
}
function changeCustomer(){
  if(customerList.value){
    let len = customerList.value.length
    let customer = customerList.value[1,randomNum(1,len)]
    setOrderFormCustomer(customer)
  }else {
    ElMessage.error('用户列表不存在,请重新选择商品，生成订单')
  }
  
}

function setOrderFormCustomer(customer){
  if(customer){
    orderForm.value.customerId = customer.userName
    orderForm.value.customerName = customer.userName
    orderForm.value.customerPhone = customer.phone
    orderForm.value.getAddress =customer.comAddress 
  }
 
}
// 生成订单
async function createOrder () {

  if (tableSelectionData.value) {
    let tempDate = tableSelectionData.value[0].date
    let hasDiffDate = tableSelectionData.value.find(item=>{
      return item.date !== tempDate
    })
    if(hasDiffDate){
      ElMessage.warning('所选商品的日期不一致，请谨慎操作')
    }
    
    // 获取顾客
    customerList.value = await getCustomerList();
    setOrderFormCustomer(customerList.value[0])
    orderForm.value.proList = tableSelectionData.value
    let totalMoneyChina = 0
    orderForm.value.proList.forEach(item=>{
      totalMoneyChina += Number(item.num) * Number(item.price)
    })
    orderForm.value.totalMoneyChina = Number(totalMoneyChina)
    orderForm.value.getDate =  tableSelectionData.value[0].date

    orderDialogVisible.value = true;

  } else {
    ElMessage.error("请选择对应的商品后再生成订单");
  }
}

function filterStatus (value, row, column) {
  // const property = column["property"];
  // console.log('filterStatus value:',value,row,column)
  // console.log('property value:',property)
  return row['status'] === value;
}
async function editRow (index, row) {
  console.log("row:", row);
  editType.value = "edit";
  newDialogVisible.value = true;
  newProForm.value = row;
}

function deleteRow (index, row) {
  ElMessageBox.confirm("确定要删除该商品信息吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      await deleteProductApi({ _id: row._id });
      ElMessage({
        type: "success",
        message: "删除成功",
      });
      getProductList();
    })
    .catch((error) => {
      // ElMessage({
      //   type: 'info',
      //   message: '删除失败',
      // })
      console.error(error);
    });
}

onMounted(() => {
  getProductList();
});
</script>
<style lang="scss" scoped>
.tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 0px;

  .t-left {
    display: flex;
    align-items: center;

    .el-upload {
      margin-right: 10px;
      display: flex;
      align-items: center;
    }

    .el-button {
      margin-right: 10px;
    }
  }

  .t-right {
    display: flex;
    align-items: center;

    ::v-deep(.el-date-editor) {
      width: 280px;
    }

    .el-date-picker {
      margin-left: 10px;
    }

    .el-select {
      margin-left: 10px;
      width: 200px;
    }

    .el-button {
      margin-left: 10px;
    }
  }
}

.table-wrap {
  margin-top: 20px;
}

.page-wrap {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.pro-form {
  width: 500px;
}
</style>
