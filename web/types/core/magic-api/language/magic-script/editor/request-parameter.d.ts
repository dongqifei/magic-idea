/**
 * 获取请求参数，用于在代码提示中获取设定的的请求参数
 */
declare const RequestParameter: {
    environmentFunction: () => void;
    setEnvironment: (callback: any) => any;
};
export default RequestParameter;
