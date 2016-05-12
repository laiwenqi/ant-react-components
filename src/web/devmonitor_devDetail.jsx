import React from 'react';
import reqwest from 'reqwest';
import PubSub from 'pubsub-js';
import classNames from 'classnames';
import web_config from '../function/config.js';
import commonFunction from '../function/function.js';
import { Alert,Row,Col,Checkbox,Button,Modal,Tag,Form,Card } from 'antd';
import './devmonitor.less';
import Devmonitor from '../web/devmonitor.jsx';
const FormItem = Form.Item;


const boxStatus=function(state){
  switch (+state) {
    case 0:
      return '已清零';
    case 1:
      return '工作中';
    case 2:
      return '已回收';
    case 9:
      return (<span style={{color:'red'}}>故障</span>);
  }
};

const devStatus=function(status){
	if(+status<90){
    return 0;
  }
  if(+status<100){
    return 1;
  }
  if(+status>=100){
    return 2;
  }
}

//标签分页里面的整个内容
const DevDetail= React.createClass({
   getInitialState() {
    return {
      loading:false,
      data:[],
      SelectDev:[],
      allSelectDevList:[],
      AllSelectCheckbox:false,
      isAllSelectDev:2,
      MouseOverIndex:'',
      MouseOutIndex:'',
      Return:{
        visible:false
      },
      ModelDevDetailVisiable:false,
      ModelDevDetailInfo:[],
      ModelDevDetailBox:[]
    }
  },
  componentDidMount() {
    this.fetchList();
  },
  fetchList(){
    reqwest({
      url:web_config.http_request_domain+'/proc/devmonitor/devlist',
      method: 'POST',
      data:{ORG_ID:this.props.ORG_ID},
      timeout :web_config.http_request_timeout,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        let t=[];
        for(let i=0;i<result.data.O_DEVMONITOR.length;i++){
            t.push(result.data.O_DEVMONITOR[i].DEV_ID);
        }
        this.setState({
          loading: false,
          data: result.data.O_DEVMONITOR,
          allSelectDevList:t
        });
      }
    });
  },
  fetchModelDevDetailInfo(DEV_ID){
    reqwest({
      url:web_config.http_request_domain+'/proc/devmonitor/devdetail',
      method: 'POST',
      data:{DEV_ID:DEV_ID},
      timeout :web_config.http_request_timeout,
      crossOrigin: web_config.http_request_cross, //跨域
      type: "json",
      success: (result) => {
        this.setState({
          loading: false,
          ModelDevDetailInfo: result.data.O_DEVMONITOR_DETAIL,
          ModelDevDetailBox: result.data.O_CONTAINER_REALTIME
        });
      }
    });
  },
  devMouseOver(index){
    this.setState({
      MouseOverIndex:index,
        MouseOutIndex:""
    });
  },
  devMouseOut(index){
    this.setState({
      MouseOverIndex:'',
      MouseOutIndex:index
    });
  },
  devSelectRemove(s,val){
      let index = s.indexOf(val);
      if (index > -1) {
        return s.splice(index, 1);
      }
  },
  allDevSelect(e){
    if(this.state.AllSelectCheckbox==true){
      this.setState({
        SelectDev:[],
        isAllSelectDev:0,
        AllSelectCheckbox:false
      })
    }else{
      let DevList=JSON.parse(JSON.stringify(this.state.allSelectDevList));
      this.setState({
        SelectDev:DevList,
        isAllSelectDev:1,
        AllSelectCheckbox:true
      })
    }
  },
  onChange(e) {
    if(this.state.SelectDev.indexOf(e.target['data-dev-id'])==-1){
      this.state.SelectDev.push(e.target['data-dev-id']);
      let temp=this.state.SelectDev;
      this.setState({
        SelectDev:temp,
        isAllSelectDev:2,
        AllSelectCheckbox:false
      });
    }else{
      this.devSelectRemove(this.state.SelectDev,e.target['data-dev-id']);
      this.setState({
        SelectDev:this.state.SelectDev,
        isAllSelectDev:2,
        AllSelectCheckbox:false
      });
    }
  },
  handleRetrun(){
    this.setState({
      Return:{
        visible:true
      }
    });
  },
  showModelDevDetail(DEV_ID){
    this.fetchModelDevDetailInfo(DEV_ID);
    this.setState({
      ModelDevDetailVisiable:true
    });
  },
  hideModelDevDetail(){
    this.setState({
      ModelDevDetailVisiable:false
    });
  },
  render() {
    if(this.state.Return.visible==true){
      return (
        <Devmonitor/>
      );
    }

    let onChange=this.onChange;
    let devMouseOver=this.devMouseOver;
    let devMouseOut=this.devMouseOut;
    let devSelect=this.devSelect;
    let showModelDevDetail=this.showModelDevDetail;
    let hideModelDevDetail=this.hideModelDevDetail;

    let allDev=0,allOnDev=0,allOutDev=0,allBadDev=0;
    let Overindex=this.state.MouseOverIndex;
    let Outindex=this.state.MouseOutIndex;
    let SelectDev=this.state.SelectDev;

    let allDevCheck=this.state.AllSelectCheckbox;



    const showBody=this.state.data.map(function(item){
         let checkshow='el-display-none';

         if(Overindex==item.DEV_ID){
            checkshow='';
         }
         if(Outindex==item.DEV_ID){
           checkshow='el-display-none';
         }
         if(SelectDev.indexOf(item.DEV_ID)!=-1){
           checkshow='';
         }


        let DevCheck=false;

        if(SelectDev.indexOf(item.DEV_ID)!=-1){
          DevCheck=true;
        }

         return(
            <div className="devDetail-card" onMouseOver={devMouseOver.bind(null, item.DEV_ID)} onMouseOut={devMouseOut.bind(null, item.DEV_ID)}>
             <div className="dev-card-img-box"><img className="dev-card-img" src={"/static/2.0.0/image/"+item.DVTP_CODE+"-"+devStatus(item.TMRT_STAT_CODE)+".png"} /></div>
             <div className="dev-card-info">
               <div className="dev-card-info-item"><a onClick={showModelDevDetail.bind(null, item.DEV_ID)}><span title={ item.DEV_NAME }  >{ commonFunction.strLengthLimit(item.DEV_NAME,10) }</span></a></div>
               <div className="dev-card-info-item"><span>{ commonFunction.strLengthLimit(item.DEV_CODE,10) }</span></div>
               <div className="dev-card-info-item"><span>{ commonFunction.strLengthLimit(item.DEV_SN,10) }</span></div>
               <div className="dev-card-info-item"><span></span></div>
             </div>
             <div className={"dev-checkbox-item "+checkshow}>
               <Checkbox checked={DevCheck}  data-dev-id={item.DEV_ID} onChange={onChange}/>
             </div>

            </div>

         );
    });
    let DetailInfo;
    if(this.state.ModelDevDetailInfo.length==0){
      DetailInfo='暂无';
    }else{
      DetailInfo=(
        <Form inline>
        <div style={{marginLeft:20}}>
           <FormItem label={<strong>归属系统：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
               {this.state.ModelDevDetailInfo[0].SYSTEM_NAME}
             </div>
           </FormItem>
           <FormItem label={<strong>归属组织：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
               {this.state.ModelDevDetailInfo[0].ORG_NAME}
             </div>
           </FormItem>
           <FormItem label={<strong>终端类型：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
                 {this.state.ModelDevDetailInfo[0].DVTP_NAME}
             </div>
           </FormItem>
           <FormItem label={<strong>终端名称：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
               {this.state.ModelDevDetailInfo[0].DEV_NAME}
             </div>
           </FormItem>
           <FormItem label={<strong>终端版本：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
                 {this.state.ModelDevDetailInfo[0].DVMD_VER}
             </div>
           </FormItem>
           <FormItem label={<strong>终端编号：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
                 {this.state.ModelDevDetailInfo[0].DEV_CODE}
             </div>
           </FormItem>
           <FormItem label={<strong>终端序列号：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
                 {this.state.ModelDevDetailInfo[0].DEV_SN}
             </div>
           </FormItem>
           <FormItem label={<strong>外部编码：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
                 暂无
             </div>
           </FormItem>
           <FormItem label={<strong>工作时间：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
                 {commonFunction.insert_flg(commonFunction.fillingStr(this.state.ModelDevDetailInfo[0].DEV_START_TIME,'0',4,0),":",2)} ~ {commonFunction.insert_flg(commonFunction.fillingStr(this.state.ModelDevDetailInfo[0].DEV_END_TIME,'0',4,0),":",2)}
             </div>
           </FormItem>
           <FormItem label={<strong>终端描述：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
                 {this.state.ModelDevDetailInfo[0].DEV_INFO==''?'暂无':this.state.ModelDevDetailInfo[0].DEV_INFO}
             </div>
           </FormItem>
           <FormItem label={<strong>终端地址：</strong>}  style={{ width: 200 }}>
             <div  className="item-highlight">
                 暂无
             </div>
           </FormItem>
           </div>
        </Form>
      )
    }

    let DetailBox;
    if(this.state.ModelDevDetailBox.length==0){
      DetailBox='暂无';
    }else{
      DetailBox=this.state.ModelDevDetailBox.map(function(item){
        return (
          <FormItem style={{ width: 200 }}>
             <Card title={item.CTTP_NAME} bordered={true}>
                 <div className="dev-detail-box-item">容器编号：{item.CTTP_NAME}</div>
                 <div className="dev-detail-box-item">通道号：{item.CTNR_CHANNEL}</div>
                 <div className="dev-detail-box-item">当前数：{item.CTNR_SAVE_NUM+item.CTNR_COUNT_NUM}</div>
                 <div className="dev-detail-box-item">预存数：{item.CTNR_SAVE_NUM}</div>
                 <div className="dev-detail-box-item">运行状态：{boxStatus(item.CTNR_STAT)}</div>
                 <div className="dev-detail-box-item">更新时间：{commonFunction.formatTime(item.CTNR_UPDATE_TIME,'yyyy-MM-dd hh:mm:ss')}</div>
             </Card>
          </FormItem>
        )
      });
    }


    return (
      <div>
      <div>
        <div key="div1">
             <Row>
              <Col span="5"><span className="peizhicanshu-title"> {this.props.ORG_PATH_NAME}  - 终端列表</span></Col>
              <Col span="3"><div  className="tip-button" onClick={this.handleRetrun}><span className="icon-toinstlist"></span>返回终端维护</div></Col>
              <Col ><div className="devAllcheck" > <Checkbox checked={allDevCheck} onChange={this.allDevSelect} />全选</div></Col>
             </Row>
             <hr className="hr"/>
         </div>

          <div className={"ant-alert ant-alert-info form-item "+(SelectDev.length>0?'':'el-display-none')}  row="">
        	     {"已选中 "+SelectDev.length+" 台终端"}
               <Button className="dev-oper-button" type="primary" size="small">
                  启动服务
               </Button>
               <Button className="dev-oper-button" type="primary" size="small">
                  暂停服务
               </Button>
               <Button className="dev-oper-button" type="primary" size="small">
                  安全关机
               </Button>
               <Button className="dev-oper-button" type="primary" size="small">
                  安全关机
               </Button>
               <Button className="dev-oper-button" type="primary" size="small">
                  强制关机
               </Button>
               <Button className="dev-oper-button" type="primary" size="small">
                  强制重启
               </Button>
               <Button className="dev-oper-button" type="primary" size="small">
                  软件升级
               </Button>
               <Button className="dev-oper-button" type="primary" size="small">
                  上传日志
               </Button>
      	  </div>
        </div>
         <div>



              {showBody}



         </div>

         <Modal ref="modal"
          width="900"
                  visible={this.state.ModelDevDetailVisiable}
                  title="终端详情"
                  onCancel={this.hideModelDevDetail}
                  footer={[
                    <Button key="submit" type="primary" size="large" onClick={this.hideModelDevDetail}>确定</Button>
                  ]}>
                        <Tag  color="blue">终端信息</Tag>
                            { DetailInfo }
                           <hr className="hr"/>

                           <Tag color="blue">容器信息</Tag>
                              <Form inline>
                              <div className="dev-detail-box" style={{marginLeft:20}}>

                                { DetailBox }
                                 </div>
                              </Form>


                </Modal>


     </div>
    );
  }
});



export default DevDetail;
