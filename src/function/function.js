import { message } from 'antd';

//一些公共函数
const commonFunction={
  //全局提示
  MessageTip:function(msg,time,type){
      time=time||2;
      type=type||'success';
      switch(type){
        case 'success':
          message.success(msg,time);
        break;
        case 'error':
          message.error(msg,time);
        break;
        case 'info':
          message.info(msg,time);
        break;
        case 'loading':
          message.loading(msg,time);
        break;
    }
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
  }
};

export default commonFunction;
