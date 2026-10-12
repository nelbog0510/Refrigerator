/** 재료 관리 화면으로 이동하면서 넘기는 1회성 안내 (router location.state) */
export interface InventoryFlash {
  notice: string
  /** 있으면 "되돌리기" 버튼으로 이 로트들의 삭제를 취소할 수 있다. */
  undoDeleteLotIds?: string[]
}
