import { ItemUOMType } from "./itemUOMType";

export type ItemType = {
  name: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  image?: string;
  uoms?: ItemUOMType[];
};
