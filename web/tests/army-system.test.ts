import assert from "node:assert/strict";
import test from "node:test";
import { ArmyCmd, ArmyProxy, createArmyFromServer } from "../src/legacy/army/army-proxy.ts";

const raw = { id: 1, cityId: 2, order: 1, generals: [10, 11], soldiers: [100, 200], con_times: [0, 0], con_cnts: [0, 0], cmd: 4, state: 1, from_x: 3, from_y: 4, to_x: 8, to_y: 9, start: 10, end: 20 };

test("Quân quay về giữ quy tắc đảo tọa độ và đổi giây sang mili giây", () => {
 const army=createArmyFromServer(raw)!;
 assert.deepEqual({fromX:army.fromX,fromY:army.fromY,toX:army.toX,toY:army.toY,start:army.startTime,end:army.endTime},{fromX:8,fromY:9,toX:3,toY:4,start:10000,end:20000});
});

test("ArmyProxy giữ tối đa 5 vị trí mỗi thành và cập nhật theo order", () => {
 const proxy=new ArmyProxy(); proxy.updateArmies(2,[{...raw,cmd:ArmyCmd.Idle},{...raw,id:2,order:5,cmd:ArmyCmd.Idle}]);
 assert.equal(proxy.getArmyList(2).length,5); assert.equal(proxy.getArmyByOrder(5,2)?.id,2);
});

test("Quân nhàn rỗi nằm tại điểm xuất phát giống Cocos", () => {
 const army=createArmyFromServer({...raw,cmd:ArmyCmd.Idle})!;
 assert.deepEqual({x:army.x,y:army.y},{x:3,y:4});
});
