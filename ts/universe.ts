import Character from "./character";
import Namer from "./namer";
import * as express from "express";
import {Authentication} from "./authentication";

export module Universe {
  let worlds: {[key: string]: {[key: string]: Character}} = {};
  let worldPopulationLimit = 64;

  function getWorld(world: string) {
    return worlds[Namer.convertNameToKey(world)];
  }

  export function createWorld(world: string) {
    if (!worldExists(world)) {
      worlds[Namer.convertNameToKey(world)] = {};
      console.log("Created a world named '" + world + "'.");
    }
  }

  export function worldExists(world: string) {
    return Object.keys(worlds).indexOf(Namer.convertNameToKey(world)) != -1;
  }

  /** Returns true when the world is full (see Universe.worldPopulationLimit) or doesn't exist (you can't put stuff in non existing things). */
  export function isWorldFull(world: string) {
    if (worldExists(world)) {
      return Object.keys(getWorld(world)).length >= worldPopulationLimit;
    } else {
      return true;
    }
  }

  /** Returns false when the character can't be created, ie. when it exists already or the world is full. (See Universe.isWorldFull() for more specifics.) */
  export function createCharacter(world: string, name: string, authkey: string): boolean {
    if (characterExists(world, name)) {
      console.log(name+ " exists!")
      return false;
    } else if (isWorldFull(world)) {
      console.log("Didn't create character '" + name + "' because the world '" + world + "' is full!");
      return false;
    } else {
      let key = Namer.convertNameToKey(name);
      let character = new Character(name);
      getWorld(world)[key] = character;
      Authentication.permission.give(character.viewPL, authkey);
      Authentication.permission.give(character.editPL, authkey);
      console.log("Created a character named '" + name + "' on the world '" + world + "'.");
      return true;
    }
  }

  export function characterExists(world: string, name: string) {
    return worldExists(world) && Object.keys(getWorld(world)).indexOf(Namer.convertNameToKey(name)) != -1;
  }

  export function getCharacter(world: string, name: string) {
    if (characterExists(world, name)) {
      return getWorld(world)[Namer.convertNameToKey(name)];
    }
  }

  export function tellWorldsToReq(req: express.Request, res: express.Response) {
    if (Authentication.getAuthtoken(req) !== undefined) {
      res.send(Object.keys(worlds));
    } else {
      res.send([]);
    }
  }

  export function canCreateCharacter(req: express.Request, res: express.Response) {
    let world = req.params.world;
    if (Authentication.getAuthtoken(req) !== undefined) {
      res.send(Universe.worldExists(world) && !isWorldFull(world));
    } else {
      res.send(false);
    }
  }

  export function createCharacterOnRequest(req: express.Request, res: express.Response) {
    let token = Authentication.getAuthtoken(req);
    if (token !== undefined) {
      let world = req.params.world;
      let name = req.params.name;
      let worldmissing = !Universe.worldExists(world);
      if (Universe.createCharacter(world, name, token)) {
        /**
        res.render("createcharacter", {
          name: name, world: world, popLimit: true,
          creation: false, worldmissing: worldmissing
        });*/
        res.statusCode = 200;
        res.send("OK");
      } else {
        res.statusCode = 403;
        res.send("ERR");
      }
    } else {
      res.statusCode = 403;
      res.send("ERR");
    }
  }

  export function getCharactersOwnedBy(token: string) {
    let characters: {[key: string]: string}[] = [];
    Object.keys(worlds).forEach(world => {

      Object.keys(worlds[world]).filter(name => {
        return Authentication.permission.has(worlds[world][name].viewPL, token) &&
          Authentication.permission.has(worlds[world][name].editPL, token);
      }).forEach(char => {

        characters.push({
          name: worlds[world][char].name,
          handle: char,
          world: world
        });

      });
    });
    return characters;
  }

  export function load(data: {[keys: string]: any}) {
    try {
      worldPopulationLimit = data["worldPopulationLimit"];

      let worldData = data["worldData"];
      Object.keys(worldData).forEach(worldName => {
        worlds[worldName] = {};
        Object.keys(worldData[worldName]).forEach(character => {
          worlds[worldName][character] = Character.load(worldData[worldName][character]);
        });
      });
      Authentication.loadUserDatabase(data["userDatabase"]);
      Authentication.permission.load(data["permissions"]);

    } catch (e) {
      console.log("Loading universe savedata failed");
      console.error(e);
    }
  }

  export function save(): {[keys: string]: any} {
    let savedata: {[keys: string]: any} = {};
    let worldData = {};

    Object.keys(worlds).forEach(worldName => {
      worldData[worldName] = {};
      Object.keys(worlds[worldName]).forEach(character => {
        worldData[worldName][character] = worlds[worldName][character].save();
      });
    });

    savedata["worldData"] = worldData;
    savedata["worldPopulationLimit"] = worldPopulationLimit;
    savedata["userDatabase"] = Authentication.saveUserDatabase();
    savedata["permissions"] = Authentication.permission.save();

    return savedata;
  }
}
