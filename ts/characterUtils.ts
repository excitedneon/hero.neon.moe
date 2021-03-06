export default class CharacterUtils {
  static getRoll(netdb: any, stat: string): number {
    if (Object.keys(CharacterUtils.characteristicValues).indexOf(stat) != -1) {
      let points = netdb.getAsInt(stat);
      return 9 + Math.floor(points / 5);
    } else if (stat.indexOf("skill-") == 0) {
      let points = netdb.getAsInt(netdb.get(stat + "-char"));
      let bonus = netdb.getAsInt(stat) / netdb.getAsInt(stat + "-cost");
      return 9 + Math.floor(points / 5) + bonus;
    } else {
      return -1;
    }
  }

  static getValue(stat: string, points: number): number {
    if (CharacterUtils.characteristicValues[stat]) {
      let vals = CharacterUtils.characteristicValues[stat];
      return Math.round(vals[0] + points / vals[1] * vals[2]);
    } else {
      return Math.round(points);
    }
  }

  static getHTHDmg(strPoints: number): number {
    return Math.floor(CharacterUtils.getValue("str", strPoints) / 5 * 2) / 2;
  }

  static getLift(strPoints: number): number {
    const vals = CharacterUtils.strengthLiftValues;
    return vals[Math.max(0, Math.min(vals.length - 1, CharacterUtils.getValue("str", strPoints)))];
  }

  static getMaxTextLength(textstat: string): number {
    return CharacterUtils.textMaxLengths[textstat];
  }

  static getSpentExperience(netdb: any) {
    const vals = CharacterUtils.characteristicValues;
    let total = 0;
    Object.keys(vals).forEach(stat => {
      total += netdb.values[stat];
    });
    Object.keys(netdb.values).forEach(stat => {
      if (CharacterUtils.isSkill(stat)) {
        total += netdb.getAsInt(stat + "-base") + netdb.getAsInt(stat);
      }
    });
    return total;
  }

  static isSkill(stat: string) {
    return stat.indexOf("skill-") == 0 && !(
          stat.indexOf("-char") + 5 == stat.length ||
          stat.indexOf("-base") + 5 == stat.length ||
          stat.indexOf("-cost") + 5 == stat.length);
  }

  static getExpForStat(netdb: any, stat: string) {
    if (stat.indexOf("skill-") == 0) {
      return netdb.getAsInt(stat + "-cost");
    } else {
      return CharacterUtils.characteristicValues[stat] ? CharacterUtils.characteristicValues[stat][1] : 1;
    }
  }

  static increaseStat(netdb: any, stat: string) {
    let exp = CharacterUtils.getExpForStat(netdb, stat);
    if (CharacterUtils.getSpentExperience(netdb) + exp <= netdb.getAsInt("exp")) {
      netdb.updateValue(stat, netdb.getAsInt(stat) + exp);
    }
  }

  static decreaseStat(netdb: any, stat: string) {
    let exp = CharacterUtils.getExpForStat(netdb, stat);
    if (CharacterUtils.getSpentExperience(netdb) - exp >= 0 &&
        netdb.getAsInt(stat) - exp >= 0) {
      netdb.updateValue(stat, netdb.getAsInt(stat) - exp);
    }
  }

  /** "stat": [base points, requiredPoints, value per required points, does stat have a characteristic roll? ] */
  static characteristicValues = {
    "str": [10, 1, 1, true], "dex": [10, 2, 1, true], "con": [10, 1, 1, true], "int": [10, 1, 1, true], "ego": [10, 1, 1, true], "pre": [10, 1, 1, true], "ocv": [3, 5, 1, false], "dcv": [3, 5, 1, false], "omcv": [3, 3, 1, false], "dmcv": [3, 3, 1, false], "spd": [2, 10, 1, false], "pd": [2, 1, 1, false], "ed": [2, 1, 1, false], "rec": [4, 1, 1, false], "end": [20, 1, 5, false], "body": [10, 1, 1, false], "stun": [20, 1, 2, false]
  };

  static strengthLiftValues = [
    0, 8, 16, 25, 38, 50, 50, 50, 75, 75, 100, 100, 100, 150, 150, 200, 200, 200, 300, 300, 400, 400, 500, 600, 600, 800, 800, 800, 1200, 1200, 1600, 1600, 1600, 1600, 1600, 3200, 3200, 3200, 3200, 3200, 6400, 6400, 6400, 6400, 6400, 12500, 12500, 12500, 12500, 12500, 25000, 25000, 25000, 25000, 25000, 50000, 50000, 50000, 50000, 50000, 100000, 100000, 100000, 100000, 100000, 200000, 200000, 200000, 200000, 200000, 400000, 400000, 400000, 400000, 400000, 800000, 800000, 800000, 800000, 800000, 1600000, 1600000, 1600000, 1600000, 1600000, 3200000, 3200000, 3200000, 3200000, 3200000, 6400000, 6400000, 6400000, 6400000, 6400000, 12500000, 12500000, 12500000, 12500000, 12500000, 25000000
  ];

  static statusCharacteristics = [ "end", "body", "stun" ];

  static textStats = [ "playername", "charactername", "alternateidentities", "background", "looks", "miscinfo" ];

  static textMaxLengths = { "playername": 100, "charactername": 100, "alternateidentities": 100, "background": 500, "looks": 500, "miscinfo": 1000 };
}
