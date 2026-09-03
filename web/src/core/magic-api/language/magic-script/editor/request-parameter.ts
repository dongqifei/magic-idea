/**
 * 获取请求参数，用于在代码提示中获取设定的的请求参数
 */
const RequestParameter = {
  environmentFunction: () => {},
  setEnvironment: (callback: any) => (RequestParameter.environmentFunction = callback)
}
export default RequestParameter
