// lib/types.ts
// TypeScript type definitions
export var CallStatus;
(function (CallStatus) {
    CallStatus[CallStatus["Pending"] = 0] = "Pending";
    CallStatus[CallStatus["Active"] = 1] = "Active";
    CallStatus[CallStatus["Ended"] = 2] = "Ended";
    CallStatus[CallStatus["Rejected"] = 3] = "Rejected";
    CallStatus[CallStatus["Missed"] = 4] = "Missed";
})(CallStatus || (CallStatus = {}));
