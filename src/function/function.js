import { message , notification  } from 'antd';

//一些公共函数
const commonFunction={
  //全局通知提示
  Notification :function(title,msg,time,type){
    const args = {
      message: title,
      description: msg,
      duration: time
    };
    notification[type](args);
  },
  //全局气泡提示
  MessageTip:function(msg,time,type){
      time=time||2;
      type=type||'success';
      message[type](msg,time);
  },
  //过滤参数中的干扰项
  filterParamsObj:function(obj){
    let newObj={};
    let ganrao=['pageSize','current'];
    for(let tem in obj){
      if(ganrao.indexOf(tem)>-1){
        continue;
      }
      newObj[tem]=obj[tem];
    }
    return newObj;
  },
  //把http request对象参数合并
  objExtend:function(obj1,obj2){
    for(let tem in obj2){
      if(tem=='type'){
        continue;
      } //不要把 type 覆盖掉
      obj1[tem]=obj2[tem];
    }
    return obj1;
  },
  formatTime:function(time,fmt){
      if(time==""||time==null||time=="null"||time==undefined||time=="undefined"){return '';}
      time=new Date(time);
      var o = {
        "M+": time.getMonth() + 1, //月份
        "d+": time.getDate(), //日
        "h+": time.getHours(), //小时
        "m+": time.getMinutes(), //分
        "s+": time.getSeconds(), //秒
        "q+": Math.floor((time.getMonth() + 3) / 3), //季度
        "S": time.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (time.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
  },
  //设置小数位数
  fillingDecimal(str,length){
    return str.toFixed(length);
  },
  //补齐字符位数 str表示原字符串变量，flg表示补齐的字符 length 表示补齐长度 type :0 前面补齐 1 后面补齐
  fillingStr(str,flg,length,type){
    str=String(str);
    while(str.length<length){
      if(type==0){ str=flg+str; }
      if(type==1){ str=str+flg; }
    }
    return str;
  },

  //指定位置插入字符串 str表示原字符串变量，flg表示要插入的字符串，sn表示要插入的位置
  insert_flg(str,flg,sn){
    str=String(str);
    let newstr="";
    for(let i=0;i<str.length;i+=sn){
        let tmp=str.substring(i, i+sn);
        newstr+=tmp+flg;
    }
    return newstr;
  }
};

export default commonFunction;
