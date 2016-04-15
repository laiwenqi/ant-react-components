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
  //把参数对象合并
  objExtend:function(obj1,obj2){
    for(let tem in obj2){
      if(tem=='type'){
        continue;
      } //不要把 type 覆盖掉
      obj1[tem]=obj2[tem];
    }
    return obj1;
  }
};

export default commonFunction;
