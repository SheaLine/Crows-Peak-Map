import type { IconType } from "react-icons";
import { IoMdCloseCircle } from "react-icons/io";
import { MdElectricBolt } from "react-icons/md";
import { IoIosWater } from "react-icons/io";
import { FaFire } from "react-icons/fa";
import { FaWifi } from "react-icons/fa6";
import { MdQuestionMark } from "react-icons/md";
import { LuMapPinHouse } from "react-icons/lu";
import { FaSearch } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { FaCamera } from "react-icons/fa6";
import { LuMapPinPlus } from "react-icons/lu";
import { TbCirclePlus } from "react-icons/tb";
import { HiOutlineHomeModern } from "react-icons/hi2";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { IoArrowBackCircle } from "react-icons/io5";
import { TbGridDots } from "react-icons/tb";
import { FaInfoCircle } from "react-icons/fa";
import {
  TbCircleNumber1,
  TbCircleNumber2,
  TbCircleNumber3,
  TbCircleNumber4,
  TbCircleNumber5,
  TbCircleNumber6,
  TbCircleNumber7,
  TbCircleNumber8,
  TbCircleNumber9,
} from "react-icons/tb";

export const IconMap: Record<string, IconType> = {
  Bolt: MdElectricBolt,
  X: IoMdCloseCircle,
  droplet: IoIosWater,
  flame: FaFire,
  Wifi: FaWifi,
  Question: MdQuestionMark,
  Border: LuMapPinHouse,
  Search: FaSearch,
  LogOut: IoIosLogOut,
  Camera: FaCamera,
  pin: LuMapPinPlus,
  plus: TbCirclePlus,
  1: TbCircleNumber1,
  2: TbCircleNumber2,
  3: TbCircleNumber3,
  4: TbCircleNumber4,
  5: TbCircleNumber5,
  6: TbCircleNumber6,
  7: TbCircleNumber7,
  8: TbCircleNumber8,
  9: TbCircleNumber9,
  building: HiOutlineHomeModern,
  edit: MdOutlineModeEditOutline,
  back: IoArrowBackCircle,
  grid: TbGridDots, 
  info: FaInfoCircle,
};
