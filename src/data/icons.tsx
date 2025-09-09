import type {IconType} from "react-icons";
import { IoMdCloseCircle } from "react-icons/io";
import { MdElectricBolt } from "react-icons/md";
import { IoIosWater } from "react-icons/io";
import { FaFire } from "react-icons/fa";
import { FaWifi } from "react-icons/fa6";
import { MdQuestionMark } from "react-icons/md";
import { LuMapPinHouse } from "react-icons/lu";
import { FaSearch } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";

export const IconMap: Record<string, IconType> = {
    Bolt : MdElectricBolt,
    X: IoMdCloseCircle,
    droplet: IoIosWater,
    flame: FaFire,
    Wifi: FaWifi,
    Question: MdQuestionMark,
    Border: LuMapPinHouse,
    Search: FaSearch,
    LogOut: IoIosLogOut 
}