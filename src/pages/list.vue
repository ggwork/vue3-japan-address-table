<template>
  <div class="main">
    <div class="tools">
      <div class="t-left">
        <el-button type="primary" @click="goForm">新增数据</el-button>
        <el-button  @click="createPersonExcel">下载数据</el-button>
      </div>
      <div class="t-right">
        <el-date-picker
          v-model="searchDate"
          type="date"
          placeholder="请输入发送日期"
        />
      </div>
    </div>
    <div class="table-wrap">
      <el-table :data="tableData" style="width: 100%" border highlight-current-row  @selection-change="tableSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="customerId" label="顧客ID"  />
        <el-table-column prop="customerName" label="顧客名" />
        <el-table-column prop="sendDate" label="発送日" />
        <el-table-column prop="proList" label="商品名(数量)(价格)" width="300" show-overflow-tooltip>
          <template #default="scope">
            <div v-for="(pro,index) in scope.row.proList" :key="index">
              {{ pro.name + '(' + pro.num + ')' + '(' +pro.price+')'}}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="totalMoneyChina" label="合計金額（元）" />
        <el-table-column prop="rate" label="為替レート" />
        <el-table-column prop="totalMoneyJapan" label="合計金額（円）" />
        <el-table-column prop="getDate" label="代金受領日" />
        <el-table-column prop="getAddress" label="郵送先" show-overflow-tooltip/>
      </el-table>
    </div>
  </div>
</template>
<script setup>
import  {ref} from 'vue'
import { ElMessage } from 'element-plus'
import { saveAs } from "file-saver";

import ExcelJS from 'exceljs'

console.log('ExcelJS:',ExcelJS)

let searchDate = ref('')

let selectionData = ref()

let logoImg = 'data:image/png;base64,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'

let tableData = ref([
  {
    customerId:'pursue. 追逐 b',
    customerName:'pursue. 追逐 b',
    sendDate:'2022/7/1  0:00:00',
    proList:[
      {
        name:'ヒューラック400',
        num:1,
        price:75
      },
      {
        name:'パブロンゴールド”',
        num:1,
        price:45
      },
      {
        name:'パブロンキッズカゼ',
        num:1,
        price:65
      },
      {
        name:'Diana　婦人靴',
        num:1,
        price:685
      },
      {
        name:'三宅一生　ボトムC',
        num:1,
        price:950
      },
      {
        name:'三宅一生　ボトムM',
        num:1,
        price:1180
      },
      {
        name:'リングフィットアドベンチャー',
        num:1,
        price:430
      },
    ],
    totalMoneyChina:3430,
    rate:17.11,
    totalMoneyJapan:17.11,
    getDate:'2022/6/28  0:00:00',
    getAddress:'上海市松江区乐都路675弄玉树南苑195号601室 3641922396 ',
  }


])

function tableSelectionChange(sectionData){
  selectionData.value = sectionData
}

// format data






function getProductData(){

  let proList  = [
    ['番号','商品名','','','','','','数量','単価（元）','小計（元）','備考'],
    ['1','ヒューラック400','','','','','','1','75','75',''],
    ['2','パブロンゴールド”','','','','','','1','45','45',''],
    ['3','パブロンキッズカゼ','','','','','','1','65','65',''],
    ['4','Diana　婦人靴','','','','','','1','685','685',''],
    ['5','三宅一生　ボトムC','','','','','','1','950','950',''],
    ['6','三宅一生　ボトムM','','','','','','1','1180','1180',''],
    ['7','リングフィットアドベンチャー','','','','','','1','430','430',''],
  ]
  let totalMoneyChina =  proList.reduce((total,curItem)=>{
    return total + Number(curItem[9])
  },0) 
  // 添加3个空行
  let emptyRow = ['','','','','','']
  proList.push(emptyRow)
  proList.push(emptyRow)
  proList.push(emptyRow)
  // 合计金额和汇率
  proList.push(['合計金額（元）','','','','','','','','','3430'],)
  proList.push(['為替レート','','','','','','','','','17.11'],)
  proList.push(['合計金額（円）','','','','','','','','',''],)

  return proList
}


function createPersonExcel(){
  let customer = {
    id:'pursue. 追逐 b',
    name:'章巍娜'
  }

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date()
  const worksheet = workbook.addWorksheet('sheet1');

  // 通过 base64  将图像添加到工作簿
  const myBase64Image = logoImg;
  const imageId2 = workbook.addImage({
    base64: myBase64Image,
    extension: 'png',
  });
  worksheet.addImage(imageId2, {
    tl: { col: 0.2, row: 1 },
    editAs:'absolute',
    ext: { width: 120, height: 60 }
  });
  
  
  


  // 单元格标题 
  worksheet.mergeCells('D3:J4');
  worksheet.getCell('D3').value = '株式会社　清沐雪　売上伝票';
  worksheet.getCell('D3').font = {
    bold:true,
    size:16,
  }
  worksheet.getCell('D3').alignment = { vertical: 'middle', horizontal: 'center' };
  // 标题样式设置完成

  // 设置发送番号
  worksheet.getCell('I5').value = 'ラベル番号：';

  // 设置顾客信息
  worksheet.mergeCells('A6:B6');
  worksheet.mergeCells('C6:D6');
  worksheet.getCell('A6').value = '顧客ID：';
  // 顾客id
  worksheet.getCell('C6').value = customer.id;
  worksheet.getCell('E6').value = '顧客名：';
  worksheet.getCell('F6').value = customer.name;
  worksheet.getCell('K6').value = '発送日：';

  // 添加商品
  let proList = getProductData()
  // 合并商品表格单元格
  // 从第7行开始以下为商品数据
  let  startRowNum = 7
  let columnLabelList = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  for(let i=0;i<proList.length -3;i++){
    let targetRowNum = startRowNum + i
    
    worksheet.insertRow(targetRowNum,proList[i])
    columnLabelList.forEach(label=>{
      let tCell = worksheet.getCell(`${label}${targetRowNum}`)
      tCell.font = { size:11}
      tCell.border = {
        top: {style:'thin', color: {argb:'00000000'}},
        left: {style:'thin', color: {argb:'00000000'}},
        bottom: {style:'thin', color: {argb:'00000000'}},
        right: {style:'thin', color: {argb:'00000000'}}
      }
    })
    worksheet.mergeCells(`B${targetRowNum}:G${targetRowNum}`)
    worksheet.mergeCells(`K${targetRowNum}:L${targetRowNum}`)
    // worksheet.addRow(['番号','商品名','','','','','','数量','単価（元）','小計（元）','備考'])
    
    
  }
  for(let j= proList.length -3;j<proList.length;j++){
    let targetRowNum = startRowNum + j
    
    worksheet.insertRow(targetRowNum,proList[j])
    columnLabelList.forEach(label=>{
      let tCell = worksheet.getCell(`${label}${targetRowNum}`)
      tCell.font = { size:11}
      tCell.alignment = { vertical: 'middle', horizontal: 'right' }
      tCell.border = {
        top: {style:'thin', color: {argb:'00000000'}},
        left: {style:'thin', color: {argb:'00000000'}},
        bottom: {style:'thin', color: {argb:'00000000'}},
        right: {style:'thin', color: {argb:'00000000'}}
      }
    })
    worksheet.mergeCells(`A${targetRowNum}:I${targetRowNum}`)
    worksheet.mergeCells(`J${targetRowNum}:L${targetRowNum}`)

    

    
  }
  // 合计金额日元部分 插入公式

  worksheet.getCell(`J${startRowNum+proList.length -1 }`).value = { formula: `J${startRowNum+proList.length-2}*J${startRowNum+proList.length -3}`, result: 0 };

  // 代金首领日 先插入一个空行
  worksheet.addRow()

  let getRowNum = startRowNum+proList.length + 1
  worksheet.addRow(['代金受領日：','','','2022/6/28  0:00:00'])
  worksheet.mergeCells(`A${getRowNum}:C${getRowNum}`)

  worksheet.addRow()
  worksheet.addRow(['郵送先：','',' 上海市松江区乐都路675弄玉树南苑195号601室 13641922396 '])
  worksheet.mergeCells(`A${getRowNum + 2}:B${getRowNum +2}`)

  // worksheet.addRow(proList)
  workbook.xlsx.writeBuffer().then(buffer => {
      // done
      saveAs(new Blob([buffer]), `${Date.now()}_feedback.xlsx`);
  });
}



</script>
<style lang="scss" scoped>
.tools{
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.table-wrap{
  margin-top: 20px;
}
</style>