import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
import DevDetail from '../web/devmonitor_devDetail.jsx';
import { Alert } from 'antd';
import './devmonitor.less';



//标签分页里面的整个内容
const Devmonitor= React.createClass({
   getInitialState() {
    return {
      loading:false,
      data:[],
      devDetail:{
        visible:false,
        params:[]
      }
    }
  },
  componentDidMount() {
    this.fetchList();
  },
  fetchList(){
    reqwest({
      url:web_config.http_request_domain+'/proc/devmonitor/orglist',
      method: 'POST',
      data:'',
      timeout :web_config.http_request_timeout,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        this.setState({
          loading: false,
          data: result.data.O_DEVMONITOR_ORG_LIST.data,
        });
      }
    });
  },
  devDetailShow(ORG_ID,ORG_PATH_NAME){
    this.setState({
      devDetail:{
        visible:true,
        params:{
          ORG_PATH_NAME:ORG_PATH_NAME,
          ORG_ID:ORG_ID
          }
      }
    });
  },
  render() {
    //查看详细跳转
    if(this.state.devDetail.visible==true){
      return (<DevDetail {...this.state.devDetail.params}/>)
    }

    let devDetailShow=this.devDetailShow; //3个点击都是跳转一个页面
    let allDev=0,allOnDev=0,allOutDev=0,allBadDev=0;
    const showBody=this.state.data.map(function(item){
         allDev+=item.THIS_ON_NUM;
         allDev+=item.THIS_OUT_NUM;
         allDev+=item.THIS_BAD_NUM;
         allOnDev+=item.THIS_ON_NUM;
         allOutDev+=item.THIS_OUT_NUM;
         allBadDev+=item.THIS_BAD_NUM;
         return(
           <div className="organization-dev-card">
             <div className="organization-titile-bar">
               <div className="organization-titile"><span >{ item.ORG_PATH_NAME }</span></div>
             </div>
             <div className="organization-content">
               <div className="organization-content-devinfo">
                 <div onClick={devDetailShow.bind(null, item.ORG_ID,item.ORG_PATH_NAME)}><Alert message={"工作中设备："+ item.THIS_ON_NUM +"台"} type="success" showIcon /></div>
                 <div onClick={devDetailShow.bind(null, item.ORG_ID,item.ORG_PATH_NAME)}><Alert message={"离线设备："+ item.THIS_OUT_NUM +"台"} type="warn" showIcon /></div>
                 <div onClick={devDetailShow.bind(null, item.ORG_ID,item.ORG_PATH_NAME)}><Alert message={"故障设备："+ item.THIS_BAD_NUM +"台"} type="error" showIcon /></div>
               </div>
             </div>
           </div>
         );
    });

    return (
      <div>
          <Alert message={"目前共有 "+allDev+" 台终端，其中 "+allOnDev+" 台工作中， "+allOutDev+" 台离线， "+allBadDev+" 台故障。"} type="info" />

          <div>
              { showBody }
          </div>

      </div>
    );
  }
});



export default Devmonitor;
