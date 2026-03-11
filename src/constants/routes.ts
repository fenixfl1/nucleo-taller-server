export const MAIN_PATH = '/'
export const PATH_LOGIN = '/login'
export const PATH_REQUEST_RESET_PASSWORD = '/request_password_reset'
export const PATH_RESET_PASSWORD = '/reset_password'
export const PATH_DASHBOARD_SUMMARY = '/dashboard/summary'

// security (current app)
export const PATH_ROLE = '/role'
export const PATH_ROLE_PAGINATION = '/role/pagination'
export const PATH_ROLE_BY_ID = '/role/:roleId'

export const PATH_PERSON = '/person'
export const PATH_PERSON_PAGINATION = '/person/pagination'
export const PATH_PERSON_BY_ID = '/person/:personId'
export const PATH_PERSON_VALIDATE_IDENTITY = '/person/identity/validate'

export const PATH_CUSTOMER = '/customer'
export const PATH_CUSTOMER_PAGINATION = '/customer/pagination'
export const PATH_CUSTOMER_BY_ID = '/customer/:customerId'
export const PATH_CUSTOMER_VALIDATE_IDENTITY = '/customer/identity/validate'

export const PATH_VEHICLE = '/vehicle'
export const PATH_VEHICLE_PAGINATION = '/vehicle/pagination'
export const PATH_VEHICLE_BY_ID = '/vehicle/:vehicleId'

export const PATH_ARTICLE = '/article'
export const PATH_ARTICLE_PAGINATION = '/article/pagination'
export const PATH_ARTICLE_BY_ID = '/article/:articleId'
export const PATH_ARTICLE_COMPATIBLE_BY_VEHICLE =
  '/article/compatible/:vehicleId'

export const PATH_WORK_ORDER = '/work_order'
export const PATH_WORK_ORDER_PAGINATION = '/work_order/pagination'
export const PATH_WORK_ORDER_BY_ID = '/work_order/:workOrderId'
export const PATH_WORK_ORDER_STATUS_LIST = '/work_order/status/list'

export const PATH_WORK_ORDER_STATUS = '/work_order_status'
export const PATH_WORK_ORDER_STATUS_PAGINATION = '/work_order_status/pagination'
export const PATH_WORK_ORDER_STATUS_BY_ID = '/work_order_status/:statusId'

export const PATH_WORK_ORDER_SERVICE_TYPE = '/work_order_service_type'
export const PATH_WORK_ORDER_SERVICE_TYPE_PAGINATION =
  '/work_order_service_type/pagination'
export const PATH_WORK_ORDER_SERVICE_TYPE_BY_ID =
  '/work_order_service_type/:serviceTypeId'
export const PATH_WORK_ORDER_SERVICE_TYPE_LIST = '/work_order_service_type/list'

export const PATH_DELIVERY_RECEIPT = '/delivery_receipt'
export const PATH_DELIVERY_RECEIPT_PAGINATION = '/delivery_receipt/pagination'
export const PATH_DELIVERY_RECEIPT_BY_ID = '/delivery_receipt/:receiptId'

export const PATH_INVENTORY_MOVEMENT = '/inventory_movement'
export const PATH_INVENTORY_MOVEMENT_PAGINATION = '/inventory_movement/pagination'
export const PATH_INVENTORY_MOVEMENT_BY_ID = '/inventory_movement/:movementId'
export const PATH_INVENTORY_MOVEMENT_TYPE_LIST =
  '/inventory_movement/type/list'

export const PATH_INVENTORY_REPLENISHMENT = '/inventory_replenishment'
export const PATH_INVENTORY_REPLENISHMENT_PAGINATION =
  '/inventory_replenishment/pagination'
export const PATH_INVENTORY_REPLENISHMENT_SUMMARY =
  '/inventory_replenishment/summary'

export const PATH_INTERNAL_PURCHASE_ORDER = '/internal_purchase_order'
export const PATH_INTERNAL_PURCHASE_ORDER_PAGINATION =
  '/internal_purchase_order/pagination'
export const PATH_INTERNAL_PURCHASE_ORDER_STATUS =
  '/internal_purchase_order/status'
export const PATH_INTERNAL_PURCHASE_ORDER_BY_ID =
  '/internal_purchase_order/:internalPurchaseOrderId'

export const PATH_STAFF_ACCESS = '/staff/access'
export const PATH_STAFF_ACCESS_PAGINATION = '/staff/access/pagination'
export const PATH_STAFF_ACCESS_BY_USERNAME = '/staff/access/:username'
export const PATH_STAFF_ACCESS_CHANGE_PASSWORD = '/staff/access/change_password'

export const PATH_ACTIVITY_LOG = '/activity_log'
export const PATH_ACTIVITY_LOG_PAGINATION = '/activity_log/pagination'
export const PATH_ACTIVITY_LOG_BY_ID = '/activity_log/:activityLogId'

export const PATH_REPORT_OPERATIONAL = '/report/operational'

// menu option
export const PATH_CREATE_MENU_OPTION = '/menu_options/create_menu_option'
export const PATH_UPDATE_MENU_OPTION = '/menu_options/update_menu_option'
export const PATH_GET_USER_MENU_OPTIONS = '/menu_options/:username'
export const PATH_GET_MENU_OPTIONS_WITH_PERMISSIONS =
  '/menu_options/get_with_permission'
