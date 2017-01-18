export default class NetDB {
  /** The values to be sent. */
  values: {[key: string]: any} = {};
  /** The times of the latest updates to the values. */
  syncTimes: {[key: string]: number} = {};

  /** This exists just so everyone is on the same page about the way time is gotten. */
  static getTime() {
    return Date.now();
  }

  get(key: string) {
    return this.values[key];
  }

  updateValue(key: string, value: any, syncTime: number = NetDB.getTime()) {
    if (Object.keys(this.values).indexOf(key) == -1 || this.syncTimes[key] < syncTime) {
      this.syncTimes[key] = syncTime;
      this.values[key] = value;
    }
  }

  updateValues(newValues: {[key: string]: any}, newTime: number) {
    Object.keys(newValues).forEach(key => {
      this.updateValue(key, newValues[key], newTime);
    });
  }

  getNewValues(previousSyncTime: number): {[key: string]: any} {
    let updatePackage: {[key: string]: any} = {};
    Object.keys(this.values).forEach(key => {
      if (this.syncTimes[key] > previousSyncTime) {
        updatePackage[key] = this.values[key];
      }
    });
    return updatePackage;
  }
}
