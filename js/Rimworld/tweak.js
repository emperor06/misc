#!/usr/local/bin/node

/**
 * Fix Rimworld savegame
 *
 * For all colonists on map 0, remove bad debuffs, fully heal, make happy and fresh, etc.
 * New: add aesthetic shaper and nose to everyone!
 * New: add some more prosthetics by default!
 * New: repair worn (in both senses) apparels
 * New: remove rot from food and medicine on the ground (but not corpses, nor things in inventory)
 *
 * IMPORTANT: this uses RimJobWorld.
 * As such, pawns always have hediffs, which may not be the case on vanilla. This code should crash
 * if a pawn has no hediff.
 *
 * Run: node.exe tweak.js savegame.rws
 *
 * It was painful but this script finally produces a rms similar to the original, thanks to:
 *   - valueProcessors option on Parser, which enables protecting CR within CDATA
 *   - indent and newline options on Builder, which produce a rms with tabs and Windows newlines
 *   - xmldec option on Builder, which produces almost the same xml header
 *   - str replace to remove a space in the header, so it's exactly the same
 *   - str replace to convert back protected CR to actual CR in CDATA
 *   - a str concat to add BOM when writing the file
 *
 * Note: badHediffClasses
 *       Class="Hediff_MissingPart", replaces missing parts but interfer with bionic augments
 *       Class="rjw.Hediff_HumanlikePregnancy, remove babies from bellies
 *
 * Requires: xml2js (install with npm)
 * TODO: check if a pawn has hediffs
 *
 * by Drax
 */


if (process.argv.length != 3) {
    console.log('Error: missing argument (or too many arguments)')
    console.log(`Usage: node(.exe) tweak.js savegame.rms`);
    process.exit(1);
}

const tranquilizePrisoners = false;
      couples = [   // set to empty array to disable this feature
          ['Human380',    'Human4535254', 'Human357',     'Human1437', 'Human1833', 'Human344666'], // Popol, Appa, Plane, Yumi, Anita, Mute
          ['Human110396', 'Human110406',  'Human54520',   'Human342735'],                           // Purple, Ape, Heron, Senza
          ['Human342680', 'Human469304',  'Human1043639', 'Human312137'],                           // Baban, Lacey, Elite, Smarty
          ['Human344678', 'Human53604',   'Human56878',   'Human211420'],                           // Gron, Starry, Brumbles, Angela
      ],
      wantedImplants = [ // [Who] FreeColonist=1, Slave=2, Prisoner=4, Male=8, Female=16
          {who:  1, clazz: "Hediff_Implant",   def: "StoneskinGland",  index: 0},
          {who:  3, clazz: "Hediff_Implant",   def: "AestheticShaper", index: 0},
          {who: 16, clazz: "Hediff_Implant",   def: "VenomFangs",      index: 21},
          {who:  3, clazz: "Hediff_AddedPart", def: "AestheticNose",   index: 20},
          {who:  3, clazz: "Hediff_AddedPart", def: "ArchotechEye",    index: 16},
          {who:  3, clazz: "Hediff_AddedPart", def: "ArchotechEye",    index: 17},
          {who:  3, clazz: "Hediff_AddedPart", def: "ArchotechArm",    index: 23},
          {who:  3, clazz: "Hediff_AddedPart", def: "ArchotechArm",    index: 34},
          {who:  3, clazz: "Hediff_AddedPart", def: "ArchotechLeg",    index: 46},
          {who:  3, clazz: "Hediff_AddedPart", def: "ArchotechLeg",    index: 55}
      ];

const
    FILE    = process.argv[2],
    fs      = require('fs'),
    xml2js  = require('xml2js'),
    parser  = new xml2js.Parser({valueProcessors: [(value, name) => value.replace(/\r/g, 'τCRτ')]}), // Hack 1: protect CR in data fields by replacing them with a non-escapble crap
    builder = new xml2js.Builder({ // produce an xml similar to the original, with CRLF and space inside autoclosing tags
                xmldec: { version: "1.0", encoding: "utf-8" },
                renderOpts: { 'pretty': true, 'indent': '\t', 'newline': '\r\n', 'spacebeforeslash': ' ' }
              }),
    hediffAddedPart   = '{"$":{"Class":"Hediff_AddedPart"},"loadID":["88325"],"def":["ArchotechEye"],"ageTicks":["3600"],"part":[{"body":["Human"],"index":["16"]}],"severity":["0.5"],"visible":["True"],"combatLogEntry":["null"]}',
    hediffMissingPart = '{"$":{"Class":"Hediff_MissingPart"},"loadID":["88532"],"def":["MissingBodyPart"],"ageTicks":["3600"],"part":[{"body":["Human"],"index":["61"]}],"severity":["0.5"],"visible":["True"],"combatLogEntry":["null"],"lastInjury":["SurgicalCut"]}',
    hediffAnesthetic  = '{"$":{"Class":"HediffWithComps"},"loadID":["88325"],"def":["Anesthetic"],"ageTicks":["3600"],"severity":["0.5"],"visible":["True"],"combatLogEntry":["null"],"ticksToDisappear":["3600"]}';
    bodyTree = { // Reverse-engineered body parts hierarchy (still missing a lot of data)
        "0": [],
        "20": [],
        "16": [],
        "17": [],
        "23": [24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
        "34": [35, 36, 37, 38, 39, 40, 41, 42, 43, 44],
        "46": [47, 48, 49, 50, 51, 52, 53, 54],
        "55": [56, 57, 58, 59, 60, 61, 62, 63]
    },
    badGameConditions = ['GameCondition_HeatWave', 'GameCondition_ColdSnap', 'GameCondition_DisableElectricity'],
    badHediffClasses = ["Hediff_Injury"],
    badHediffDefs    = ["Anesthetic",
                        "FeelingBroken",
                        "MissingBodyPart",
                        "Flu",
                        "Malaria",
                        "Plague",
                        "SleepingSickness",
                        "WoundInfection",
                        "BloodLoss",
                        "BloodRot",
                        "Malnutrition",
                        "PsychicShock",
                        "CatatonicBreakdown",
                        "PsychicComa",
                        "PsychicHangover",
                        "BrainShock",
                        "FoodPoisoning",
                        "ToxicBuildup",
                        "HeartAttack",
                        "DrugOverdose",
                        "Heatstroke",
                        "Hypothermia",
                        "HypothermicSlowdown",
                        "BadBack",
                        "Frail",
                        "Cataract",
                        "Blindness",
                        "HearingLoss",
                        "Dementia",
                        "Alzheimers",
                        "Asthma",
                        "HeartArteryBlockage",
                        "Carcinoma",
                        "ExciseCarcinoma",
                        "GutWorms",
                        "MuscleParasites",
                        "FibrousMechanites",
                        "SensoryMechanites",
                        "Scaria",
                        "SandInEyes",
                        "DirtInEyes",
                        "MudInEyes",
                        "GravelInEyes",
                        "WaterInEyes",
                        "ResurrectionSickness"],
    relatives        = ["MySon", "MyDaughter", "MyFather", "MyMother", "MyGrandparent", "MyBondedAnimal",
                        "MyGrandchild", "MyBrother", "MySister", "MyFriend", "MyKin", "MyFiance",
                        "MySpouse", "MyHusband", "MyLovedOne", "MyLover", "MyAunt", "MyUncle", "MyWife", "MyNephew", "MyNiece"
                       ].map(e => ["Killed" + e, e + "Died", "Sold" + e, e + "Lost"]).flat()
                        .map(e => [e, e + "_Beast", e + "Mood", e + "_BeastMood"]).flat(),
    badMemories      = [
                        "AllowedMeToGetRaped",
                        "AteMeat_Disapproved",
                        "AteCorpse",
                        "AteWithoutTable",
                        "CheatedOnMe",
                        "CheatedOnMeMood",
                        "DivorcedMe",
                        "DivorcedMeMood",
                        "FailedConvertIdeoAttemptResentment",
                        "FailedRomanceAttemptOnMe",
                        "FailedRomanceAttemptOnMeLowOpinionMood",
                        "GotAnalRaped",
                        "GotBredByAnimal",
                        "GotRaped",
                        "GotRapedUnconscious",
                        "HadAngeringFight",
                        "HarmedMe",
                        "HateMyRapist",
                        "Insulted",
                        "InsultedMood",
                        "MyOrganHarvested",
                        "ObservedLayingCorpse",
                        "PawnWithGoodOpinionDied",
                        "RejectedMyProposal",
                        "RejectedMyProposalMood",
                        "IRejectedTheirProposal",
                        "RebuffedMyRomanceAttempt",
                        "RebuffedMyRomanceAttemptMood",
                        "RelicLost",
                        "RJWFailedSolicitation",
                        "SleepDisturbed",
                        "SleptInBarracks",
                        "SleptInHeat",
                        "SleptOnGround",
                        "SleptOutside",
                        "SleptInCold",
                        "Slighted",
                        "SoakingWet",
                        "UsedDespisedWeapon",
                        "WillDiminished",
                        "WitnessedDeathAlly",
                        "WitnessedDeathBloodlust",
                        "WitnessedDeathFamily",
                        "WitnessedDeathNonAlly",
                        "TrialConvicted",
                        "OtherTravelerArrested"
                       ].concat(relatives),
    apparelStats     = { // Extracted from game files with another js script, also by Drax :p
                        "Apparel_AdvancedHelmet": 120,
                        "Apparel_ArmorCataphract": 400,
                        "Apparel_ArmorCataphractPhoenix": 400,
                        "Apparel_ArmorCataphractPrestige": 400,
                        "Apparel_ArmorHelmetCataphract": 180,
                        "Apparel_ArmorHelmetCataphractPrestige": 180,
                        "Apparel_ArmorHelmetRecon": 120,
                        "Apparel_ArmorHelmetReconPrestige": 120,
                        "Apparel_ArmorLocust": 280,
                        "Apparel_ArmorMarineGrenadier": 340,
                        "Apparel_ArmorMarineHelmetPrestige": 150,
                        "Apparel_ArmorMarinePrestige": 340,
                        "Apparel_ArmorRecon": 280,
                        "Apparel_ArmorReconPrestige": 280,
                        "Apparel_AuthorityCap": 80,
                        "Apparel_BasicShirt": 100,
                        "Apparel_Beret": 80,
                        "Apparel_Blindfold": 80,
                        "Apparel_BodyStrap": 160,
                        "Apparel_BowlerHat": 80,
                        "Apparel_Broadwrap": 80,
                        "Apparel_Burka": 100,
                        "Apparel_Cape": 200,
                        "Apparel_Collar": 80,
                        "Apparel_CollarShirt": 100,
                        "Apparel_Coronet": 80,
                        "Apparel_Corset": 100,
                        "Apparel_CowboyHat": 80,
                        "Apparel_Crown": 80,
                        "Apparel_CrownStellic": 80,
                        "Apparel_Duster": 200,
                        "Apparel_EltexSkullcap": 80,
                        "Apparel_FlakJacket": 200,
                        "Apparel_FlakPants": 200,
                        "Apparel_FlakVest": 200,
                        "Apparel_Flophat": 80,
                        "Apparel_Gunlink": 120,
                        "Apparel_HatHood": 80,
                        "Apparel_HatLadies": 80,
                        "Apparel_HatTop": 80,
                        "Apparel_Headwrap": 80,
                        "Apparel_Jacket": 160,
                        "Apparel_PackBroadshield": 100,
                        "Apparel_PackJump": 100,
                        "Apparel_Pants": 100,
                        "Apparel_Parka": 180,
                        "Apparel_PlateArmor": 290,
                        "Apparel_PowerArmor": 340,
                        "Apparel_PowerArmorHelmet": 150,
                        "Apparel_PsychicFoilHelmet": 80,
                        "Apparel_PsychicInsanityLance": 80,
                        "Apparel_PsychicShockLance": 80,
                        "Apparel_PsyfocusHelmet": 80,
                        "Apparel_PsyfocusRobe": 100,
                        "Apparel_PsyfocusShirt": 100,
                        "Apparel_PsyfocusVest": 100,
                        "Apparel_Robe": 100,
                        "Apparel_RobeRoyal": 100,
                        "Apparel_Shadecone": 80,
                        "Apparel_ShieldBelt": 100,
                        "Apparel_ShirtRuffle": 100,
                        "Apparel_SimpleHelmet": 100,
                        "Apparel_Slicecap": 80,
                        "Apparel_SmokepopBelt": 100,
                        "Apparel_Tailcap": 80,
                        "Apparel_TortureCrown": 80,
                        "Apparel_TribalA": 100,
                        "Apparel_Tuque": 80,
                        "Apparel_VestRoyal": 100,
                        "Apparel_VisageMask": 90,
                        "Apparel_WarMask": 80,
                        "Apparel_WarVeil": 80
                       },
    stuffStats       = { // Extracted from game files with another js script, also by Drax :p
                        "Leather_Plain": 1.3,
                        "Leather_Dog": 1.3,
                        "Leather_Wolf": 1.3,
                        "Leather_Panthera": 1.3,
                        "Leather_Camel": 1.3,
                        "Leather_Bluefur": 1.3,
                        "Leather_Bear": 1.3,
                        "Leather_GuineaPig": 0.6,
                        "Leather_Human": 1.3,
                        "Leather_Pig": 1.3,
                        "Leather_Light": 1,
                        "Leather_Bird": 1,
                        "Leather_Chinchilla": 1,
                        "Leather_Fox": 1,
                        "Leather_Lizard": 1,
                        "Leather_Elephant": 1.5,
                        "Leather_Heavy": 1.5,
                        "Leather_Rhinoceros": 1.5,
                        "Leather_Thrumbo": 2,
                        "Leather_Patch": 1,
                        "Silver": 0.7,
                        "Gold": 0.6,
                        "Steel": 1,
                        "Plasteel": 2.8,
                        "WoodLog": 0.65,
                        "Uranium": 2.5,
                        "Jade": 0.5,
                        "Synthread": 1.3,
                        "DevilstrandCloth": 1.3,
                        "Hyperweave": 2.4,
                        //"Cloth": 0.7, // for some reason, that's 0.7 in game files but 1.0 ingame
                        //"WoolSheep": 0.7,
                        //"WoolAlpaca": 0.7,
                        //"WoolMegasloth": 0.7,
                        //"WoolMuffalo": 0.7,
                        //"WoolBison": 0.7
                        "Cloth": 1,
                        "WoolSheep": 1,
                        "WoolAlpaca": 1,
                        "WoolMegasloth": 1,
                        "WoolMuffalo": 1,
                        "WoolBison": 1
                       },
    animalSizes      = { // Extracted from game files with another js script, also by Drax :p
                        "BaseBear": 2.15,
                        "Bear_Grizzly": 2.15,
                        "Bear_Polar": 2.15,
                        "Ostrich": 1,
                        "Emu": 0.6,
                        "Cassowary": 0.6,
                        "Cougar": 1,
                        "Panther": 1,
                        "Lynx": 0.6,
                        "Cat": 0.32,
                        "YorkshireTerrier": 0.32,
                        "GuineaPig": 0.2,
                        "LabradorRetriever": 0.75,
                        "Husky": 0.86,
                        "Monkey": 0.35,
                        "Chicken": 0.3,
                        "Duck": 0.3,
                        "Turkey": 0.6,
                        "Goose": 0.6,
                        "Cow": 2.4,
                        "Boomalope": 2,
                        "Muffalo": 2.4,
                        "Bison": 2.4,
                        "Dromedary": 2.1,
                        "Goat": 0.75,
                        "Elk": 2.1,
                        "Yak": 2.1,
                        "Caribou": 1,
                        "Horse": 2.4,
                        "Donkey": 1.4,
                        "Elephant": 4,
                        "Rhinoceros": 3,
                        "BaseHare": 0.2,
                        "Hare": 0.2,
                        "Snowhare": 0.2,
                        "Megascarab": 0.2,
                        "Spelopede": 0.8,
                        "Megaspider": 1.2,
                        "Thrumbo": 4,
                        "Cobra": 0.25,
                        "Tortoise": 0.5,
                        "Alphabeaver": 0.45,
                        "Pig": 1.7,
                        "WildBoar": 0.85,
                        "Ibex": 1,
                        "Deer": 1.2,
                        "Gazelle": 0.7,
                        "Chinchilla": 0.35,
                        "Sheep": 0.75,
                        "Alpaca": 1,
                        "Megasloth": 4,
                        "Capybara": 0.75,
                        "Squirrel": 0.2,
                        "Rat": 0.2,
                        "Boomrat": 0.2,
                        "Raccoon": 0.4,
                        "Iguana": 0.4,
                        "Warg": 1.4,
                        "ThingBaseWolf": 0.85,
                        "Wolf_Timber": 0.85,
                        "Wolf_Arctic": 0.85,
                        "ThingBaseFox": 0.55,
                        "Fox_Fennec": 0.55,
                        "Fox_Red": 0.55,
                        "Fox_Arctic": 0.55,
                        "Human": 1,
                        "Mech_Centipede": 1.8,
                        "BaseMechanoidWalker": 1,
                        "Mech_Lancer": 1,
                        "Mech_Scyther": 1,
                        "Mech_Pikeman": 1,
                        "Mech_Termite": 1.6,
                        "Dryad_Basic": 0.667,
                        "Dryad_Woodmaker": 0.667,
                        "Dryad_Berrymaker": 0.667,
                        "Dryad_Medicinemaker": 0.667,
                        "Dryad_Gaumaker": 0.667,
                        "Dryad_Carrier": 0.667,
                        "Dryad_Clawer": 0.667,
                        "Dryad_Barkskin": 0.667,
                    };

let nextHediffID,
    myIdeo,
    currentTick,
    gameStartTick,
    allPawns = {};

fs.readFile(FILE, function(err, data) {
    parser.parseString(data, function (err, result) {
        removeGameConditions(result.savegame);
        removeBadLordJobs(result.savegame);

        // Get my ideo
        myIdeo = result.savegame.game[0].world[0].factionManager[0].allFactions[0].li.find(e => e.def[0] === 'PlayerColony').ideos[0].primaryIdeo[0];

        // Get next id and current tick
        nextHediffID  = result.savegame.game[0].uniqueIDsManager[0].nextHediffID[0];
        currentTick   = parseInt(result.savegame.game[0].tickManager[0].ticksGame[0], 10);
        gameStartTick = parseInt(result.savegame.game[0].tickManager[0].gameStartAbsTick[0], 10);

        // Fill the list of all pawns, dead or alive
        result.savegame.game[0].world[0].worldPawns[0].pawnsAlive[0].li.forEach(pawn => {
            if (pawn.def[0] === "Human") allPawns[pawn.id[0]] = {pawn: pawn, state: 'alive'}
        })
        result.savegame.game[0].world[0].worldPawns[0].pawnsDead[0].li.forEach(pawn => {
            if (pawn.def[0] === "Human") allPawns[pawn.id[0]] = {pawn: pawn, state: 'dead'}
        })
        result.savegame.game[0].maps[0].li.forEach(map => map.things[0].thing.forEach(pawn => {
            if (pawn.def[0] === "Human") allPawns[pawn.id[0]] = {pawn: pawn, state: 'map'}
        }))
        // Fix marriages for RJW + my ideo made a big mess :)
        couples.forEach(fixMarriage);

        // Loop all objects on map and find colonists
        result.savegame.game[0].maps[0].li.forEach(map => map.things[0].thing
            .filter(isMyPawn)
            .forEach(processPawn));

        // Loop on thingsWithComps
        result.savegame.game[0].maps[0].li.forEach(map => map.things[0].thing
            .forEach(processThing));

        // Update id
        result.savegame.game[0].uniqueIDsManager[0].nextHediffID[0] = nextHediffID;

        // JS to XML
        console.log('Modifications done, creating xml string…');
        // Hack 2: restore CR
        const xml = builder.buildObject(result).replace(/τCRτ/g, '\r').replace(' ?>', '?>');
        // XML to disk
        console.log('Saving xml to fixed.rws…');
        fs.writeFile('fixed.rws', '\ufeff' + xml, {encoding: 'utf8'}, function(err) {
            if (err) return console.log(err);
            console.log("Done!");
        });
    });
});

/**
 * Main actions on pawns
 * isMyPawn         = every pawn that belong to me
 * isMyFaction      = same as above, but without foreign prisoners
 * isControllable   = same as above, but without any prisoner
 * isMyColonist     = same as above, but without guests
 * isMyPureColonist = same as above, but without slaves
 * isMyGuest / isPrisoner / isSlave = self explanatory
*/
function processPawn(pawn) {
    if (isHuman(pawn))
        displayNick(pawn);

    if (!isPrisoner(pawn))
        heal(pawn);

    if (isWoman(pawn))
        makeGoodWoman(pawn);    // grown bisexual

    // Special case for prisoner women
    if (isWoman(pawn) && isPrisoner(pawn)) {
        makeGoodPrisoner(pawn); // traits: weak and slow beauties
        recruit(pawn);          // so I can easily change the name and title
        convertToMyIdeo(pawn);
        repairApparel(pawn);
    }

    if (isSlave(pawn))
        makeGoodSlave(pawn);    // traits: strong and fast beauties

    if (isMyGuest(pawn)) {
        makeGoodGuest(pawn);    // traits: happy masochists
        convertToMyIdeo(pawn);
    }

    if (isSlave(pawn) || isPrisoner(pawn)) {
        dominate(pawn);         // reduce will/resistance
        behave(pawn);           // remove mental illness
    }

    if (isMyColonist(pawn)) {
        fulfillNeeds(pawn);     // fill needs, remove bad memories
        repairApparel(pawn);
        installImplants(pawn);
        fixBodyParts(pawn); // regrow body parts, mandatory if implants (AddedParts) have been installed
    }

    // Make my female prisoners happy, but that also removes their broken state
    //if (isPrisoner(pawn) && isWoman(pawn))
    //    fulfillNeeds(pawn);

    // Can't find yet how to detect and handle prison breaks, so use this manually when it happens
    // Update: my mod now handles this
    if (tranquilizePrisoners && isPrisoner(pawn))
        tranquilize(pawn);

    // ---------------------- one time modifications
    return;
    if (isMyPureColonist(pawn)) {
        pawn.royalty[0].permits = [''];
    }
    if (isMyColonist(pawn)) {
        setAgeTicks(pawn, getAgeTicks(pawn) - 2*3600000);
    }
    if (isPrisoner(pawn) && isWoman(pawn)) {
        let age = (12 + 3*Math.random()) * 3600000;
        setAgeTicks(pawn, age);
    }
}

function processThing(thing) {
    if (isRotting(thing))
        delete thing.rotProg
    if (thing.def[0] === 'MealLavish')
        fixMeal(thing);
}

function getClazz(thing) {
    if (thing.hasOwnProperty('$') && thing.$.hasOwnProperty('Class'))
        return thing.$.Class;
    return undefined;
}

function isHuman(thing) {
    return getClazz(thing) === "Pawn" && thing.def[0] === "Human";
}

function isWoman(thing) {
    return isHuman(thing) && thing.hasOwnProperty('gender') && thing.gender[0] === "Female";
}

// All pawns that belong to me (includes slaves, guests, prisoners, and animals)
function isMyPawn(thing) {
    return getClazz(thing) === 'Pawn' &&
       (isMyFaction(thing) || isPrisoner(thing));
}

// Same as isMyPawn, less the prisoners that aren't actually from my faction
function isMyFaction(thing) {
    return thing.hasOwnProperty("faction")
        && thing.faction[0] === "Faction_13";
}

// Pawns I can control (they have a portrait)
function isControllable(thing) {
    return isHuman(thing)
        && isMyFaction(thing)
        && !isPrisoner(thing);
}

// Controllable, but not a guest
function isMyColonist(thing) {
    return isControllable(thing)
        && !isMyGuest(thing);
}

// Colonists but not slaves nor guests
function isMyPureColonist(thing) {
    return isMyColonist(thing)
        && !isSlave(thing);
}

// Guests, based on their quest
function isMyGuest(thing) {
    return isHuman(thing)
        && isMyFaction(thing)
        && typeof thing.questTags[0] === 'object'
        && thing.questTags[0].hasOwnProperty('li')
        && thing.questTags[0].li.find(e => e.includes('.lodgers') || e.includes('.beggars') || e.includes('.pawn')) !== undefined;
}

function isSlave(thing) {
    return isHuman(thing)
        && thing.hasOwnProperty('guest')
        && thing.guest[0].hasOwnProperty('guestStatus')
        && thing.guest[0].guestStatus[0] === 'Slave';
}

// Looks like prisoners have guestStatus=Prisoner and hostFaction=<my faction>
// but it seems that I'm the only one having prisoners, so there is no need to check for the faction
function isPrisoner(thing) {
    return isHuman(thing)
        && thing.hasOwnProperty('guest')
        && thing.guest[0].hasOwnProperty('guestStatus')
        && thing.guest[0].guestStatus[0] === 'Prisoner';
}

// Corpses can rot, but it's best to let them rot
function isRotting(thing) {
    return thing.hasOwnProperty('rotProg')
        && ["ThingWithComps", "Medicine"].includes(getClazz(thing));
}

function isGoodHediff(hediff) {
    return !(hediff.hasOwnProperty("$") && badHediffClasses.includes(hediff.$.Class)
            || badHediffDefs.includes(hediff.def[0]));
}

function isGoodMemory(memory) {
    let def = memory.def[0];
    return !(badMemories.includes(def)
        || def.match(/Know_Horrible/)
        || def.match(/Know_Disapproved/)
        || def.match(/Know_Abhorrent/)
    );
}

function behave(pawn) {
    let brain = pawn.mindState[0].mentalStateHandler[0].curState;
    if (!brain[0].$.hasOwnProperty('IsNull') || brain[0].$['IsNull'] !== "True") {
        if (brain[0].hasOwnProperty('forceRecoverAfterTicks'))
            brain[0].forceRecoverAfterTicks = [1]; // try to be nice, end it after 1 tick
        else
            pawn.mindState[0].mentalStateHandler[0] = [{'curState': {'$': {'IsNull': 'True'}}}];
        // Put him down now. The mental state will cease but the ppl he fought will still be fighting him.
        pawn.healthTracker[0]['healthState'] = ['Down'];
    }
}

function recruit(pawn) {
    pawn.faction = ['Faction_13'];
}

function makeGoodWoman(pawn) {
    if (pawn.hasOwnProperty('RJW_Orientation'))
        pawn.RJW_Orientation = ['Bisexual'];
    if (pawn.hasOwnProperty('RJW_Quirks'))
        pawn.RJW_Quirks = ['Exhibitionist, Fertile, Vigorous, Podophile, Skin lover'];
    let traits = pawn.story[0].traits[0].allTraits[0];
    if (typeof traits != 'object')
        pawn.story[0].traits[0].allTraits[0].li = ['Bisexual'];
    else if (!traits.li.find(e => e.def[0] === 'Bisexual'))
        traits.li.push({def: 'Bisexual'});
    pawn.ageTracker[0].growth = ['1'];
    pawn.ageTracker[0].nextGrowthCheckTick = ['9223372036854775807'];
}

// Designed for prisoner babes
function makeGoodPrisoner(pawn) {
    pawn.story[0].traits[0].allTraits[0].li = [
        {def: 'Bisexual'},
        {def: 'Beauty', degree: '2'},
        {def: 'Nymphomaniac'},
        {def: 'Masochist'},
        {def: 'SpeedOffset', degree: '-1'},
        {def: 'Wimp'},
        {def: 'Undergrounder'}
    ];
}

function makeGoodSlave(pawn) {
    pawn.story[0].traits[0].allTraits[0].li = [
        {def: 'Bisexual'},
        {def: 'Beauty', degree: '2'},
        {def: 'Nymphomaniac'},
        {def: 'Masochist'},
        {def: 'QuickSleeper'},
        {def: 'SpeedOffset', degree: '2'},
        {def: 'ShootingAccuracy', degree: '-1'},
        {def: 'Industriousness', degree: '2'},
        {def: 'Neurotic', degree: '2'}
    ];
}

function makeGoodGuest(pawn) {
    pawn.story[0].traits[0].allTraits[0].li = [
        {def: "NaturalMood", degree: "2"},
        {def: "SpeedOffset", degree: "2"},
        {def: "Masochist"}
    ];
}

// Loosing my religion
function convertToMyIdeo(pawn) {
    pawn.ideo[0].ideo[0] = myIdeo;
    pawn.ideo[0].certainty[0] = "1";
}

function dominate(pawn) {
    if (pawn.hasOwnProperty('guest')) {
        if (pawn.guest[0].hasOwnProperty('resistance'))
            pawn.guest[0].resistance[0] = 0;
        if (pawn.guest[0].hasOwnProperty('will'))
            pawn.guest[0].will[0] = 0;
    }
}

function createImplant(clazz, def, index) {
    let hediff = JSON.parse(hediffAddedPart);
    hediff.$.Class = clazz;
    hediff.def[0] = def;
    hediff.part[0].index[0] = index;
    hediff.loadID[0] = nextHediffID++;
    return hediff;
}

function createMissingPart(index) {
    let hediff = JSON.parse(hediffMissingPart);
    hediff.part[0].index[0] = index;
    hediff.loadID[0] = nextHediffID++;
    return hediff;
}

//hediff.hasOwnProperty("part") && hediff.part[0].body[0] == "Human" && hediff.hasOwnProperty("index")
function getImplantIndex(hediff) {
    if (hediff.hasOwnProperty("$") && ["Hediff_AddedPart", "Hediff_Implant"].includes(hediff.$.Class))
        return parseInt(hediff.part[0].index[0], 10);
    return undefined;
}

function getMissingPartIndex(hediff) {
    if (hediff.hasOwnProperty("$") && hediff.$.Class === "Hediff_MissingPart")
        return hediff.part[0].index[0];
    return undefined;
}

function alreadyInstalled(pawn, part) {
    let hediffs = pawn.healthTracker[0].hediffSet[0].hediffs[0].li;
    // For actual implants, one can have multiple implants at the same index
    if (part.clazz === "Hediff_Implant")
        return hediffs.some(hediff => hediff.def[0] === part.def);
    // For AddedPart, only 1 implant per index is allowed
    return hediffs.some(hediff => getImplantIndex(hediff) === part.index);
}

function displayNick(pawn) {
    console.log(pawn.name[0].nick[0]);
}

// 1 year = 3600000 ticks
function getAgeTicks(pawn) {
    return parseInt(pawn.ageTracker[0].ageBiologicalTicks[0], 10);
}

// birth = ticks + gameStart - age but, for some reason, most pawns have a difference of 10~30. No idea why.
function setAgeTicks(pawn, age) {
    let birth = currentTick + gameStartTick - age;
    pawn.ageTracker[0].ageBiologicalTicks[0] = Math.floor(age);
    pawn.ageTracker[0].birthAbsTicks[0] = Math.floor(birth);
}

function heal(pawn) {
    let tracker = pawn.healthTracker[0];
    if (tracker.hasOwnProperty("healthState") && tracker.healthState[0] === "Down")
        delete tracker.healthState;

    // Remove bad hediffs (wounds, sickness, babies)
    tracker.hediffSet[0].hediffs[0].li = tracker.hediffSet[0].hediffs[0].li.filter(isGoodHediff);
}

function installImplants(pawn) {
    if (!isHuman(pawn)) return; // Just in case

    let mask = 0;
    if (isMyPureColonist(pawn)) mask = 1;
    else if (isSlave(pawn))     mask = 2;
    else if (isPrisoner(pawn))  mask = 4;
    mask |= isWoman(pawn) ? 16 : 8;

    let hediffs = pawn.healthTracker[0].hediffSet[0].hediffs[0].li;
    wantedImplants.forEach(part => {
        if (mask & part.who && !alreadyInstalled(pawn, part))
            hediffs.push(createImplant(part.clazz, part.def, part.index));
    });
}

function fixBodyParts(pawn) {
    let hediffs = pawn.healthTracker[0].hediffSet[0].hediffs[0].li;
    let implants = []; // currently installed implant indices
    let missing = [];  // currently missing body parts
    let needed = [];   // body parts that need to be removed

    // Find currently installed/removed body parts
    hediffs.forEach(hediff => {
        let index = getImplantIndex(hediff);
        index !== undefined && implants.push(index);
        index = getMissingPartIndex(hediff);
        index !== undefined && missing.push(index);
    });

    // Build the list of body parts that need to be removed (because of installed implants)
    implants.forEach(ind => ind in bodyTree && needed.push(bodyTree[ind]));

    // Remove unwanted missing parts (restore destroyed members)
    let toRemove = missing.filter(ind => !needed.includes(ind));
    hediffs = hediffs.filter(hediff => {
        let index = getMissingPartIndex(hediff);
        return index === undefined || !toRemove.includes(index);
    });

    // Add the correct missing parts to ensure proper implants
    // TODO: needs another check here. I'm positive that installing an arm removes the original body parts
    // but now, the game just removes these missing parts. Maybe the original arm stays missing for a little while?
    // In any case, it seems there's no need to execute the following code anymore.
    // Note: when an implant is made, it's "fresh". Maybe setting the age tick of the implant to a large value is enough?
    /*
    let toAdd = needed.filter(ind => !missing.includes(ind));
    toAdd.forEach(ind => {
        hediffs.push(createMissingPart(ind));
    });
    */

    // And finally, replace the hediffs with the new array
    pawn.healthTracker[0].hediffSet[0].hediffs[0].li = hediffs;
}

function repairApparel(pawn) {
    let apparels = pawn.apparel[0].wornApparel[0].innerList[0];
    // Make sure the pawn is not naked…
    if (apparels.hasOwnProperty('li'))
        apparels.li.forEach(_repairApparel);
}

function _repairApparel(apparel, zboub) {
    if (!apparel.hasOwnProperty('health'))
        return; // Can't do much about it

    let maxHp = 100;
    if (apparelStats.hasOwnProperty(apparel.def[0]))
        maxHp = apparelStats[apparel.def[0]];
    else
        console.log("Warning: unknown apparel stats for " + apparel.def[0]);
    // If there's no stuff, it's probably a utility belt which take no damage and have a default 100 HP
    if (apparel.hasOwnProperty('stuff') && stuffStats.hasOwnProperty(apparel.stuff[0]))
        maxHp *= stuffStats[apparel.stuff[0]];
    apparel.health[0] = maxHp;
}

function fulfillNeeds(pawn) {
    let needs = pawn.needs[0].needs[0].li;
    needs.forEach(need => {
        // Needs go from 0 to 1, but 1 means they don't need anything…
        need.curLevel = [1];

        // for Joy, reset tolerance to zero
        if (need.def[0] === "Joy") {
            need.tolerances[0].vals[0].li.fill(0);
            need.bored[0].vals[0].li.fill("False");
        // for Mood, fix bad memories
        } else if (need.def[0] === "Mood") {
            let memory = need.thoughts[0].memories[0].memories[0];
            memory.li = memory.li.filter(isGoodMemory);
        } else if (need.def[0] === "Food") {
            // This one is trickier. It seems to depend on both the pawn race (base size) and its growth (juvenile has a 0.6 coef).
            // E.g. Yak has a base size of 2.1, so an adult needs 2.1 max food, but a calf has a max of 2.1*0.6=1.26
            // This size can be retrieved on its private parts, but I'm not sure if that's updated when the pawn grow and it's only available with RJW mod.
            let maxFood = 1;
            if (pawn.def[0] in animalSizes) {
                maxFood = animalSizes[pawn.def[0]];
                if (pawn.hasOwnProperty('ageTracker') && pawn.ageTracker[0].hasOwnProperty('growth')) {
                    let growth = parseFloat(pawn.ageTracker[0].growth[0], 10);
                    if (growth < 1) maxFood *= 0.6;
                } else {
                    console.log("[Food] Cannot find growth for pawn " + pawn.def[0] + ". Using " + maxFood + " as default");
                }
            } else {
                console.log("[Food] Cannot find the body size for pawn type " + pawn.def[0] + ". Using " + maxFood + " as default");
            }
            need.curLevel = [maxFood];
        }
    });
}

function createAnesthetic(age, severity, duration) {
    let hediff = JSON.parse(hediffAnesthetic);
    hediff.ageTicks[0] = age;
    hediff.severity[0] = severity;
    hediff.ticksToDisappear[0] = duration;
    hediff.loadID[0] = nextHediffID++;
    return hediff;
}

function tranquilize(pawn) {
    let hediffs = pawn.healthTracker[0].hediffSet[0].hediffs[0].li;
    hediffs.push(createAnesthetic(1, 1, 2500*4));
    // It seems like we need to punch them for the prison break to stop. Capturing a disabled pawn doesn't work.
    //pawn.healthTracker[0]['healthState'] = ['Down'];
}

function fixMarriage(couple) {
    couple.forEach(pawnId => {
        let pawn = allPawns[pawnId].pawn;
        let others = couple.filter(e => e !== pawnId);

// Let's start with filtering out all these honey talks, otherwise we'll get new lovers in seconds
        let memory = pawn.needs[0].needs[0].li.find(e => e.def[0] === 'Mood').thoughts[0].memories[0].memories[0];
        memory.li = memory.li.filter(mem => {
            return mem.def[0] !== 'DeepTalk' || others.includes(mem.otherPawn[0].substr(6)); // remove Thing_
        });

        let relations = pawn.social[0].directRelations[0]; // TODO needs a check in case the pawn has no relation at all
        let loveDefs = ['ExSpouse', 'Fiance', 'ExFiance', 'Lover', 'ExLover'];

// Destroy unwanted marriages
        // Let's begin with spouses since it's a special case: we want to keep existing marriages so we keep the correct date and don't add honeymoons
        relations.li.filter(e => e.def[0] === 'Spouse') // keep spouses
                    .map(e => e.otherPawn[0].substr(6)) // replace the content with the spouse's id
                    .filter(e => !others.includes(e))   // remove good spouses
                    .forEach(badId => {                 // Remove this pawn from the relations of those wrong spouses, otherwise we get a bug ingame
                        let other = allPawns[badId].pawn;
                        other.social[0].directRelations[0].li = other.social[0].directRelations[0].li.filter(e => e.def[0] !== 'Spouse' || e.otherPawn[0] !== 'Thing_' + pawnId);
                    });
        // And finally, remove the wrong spouses from this pawn's relations
        relations.li = relations.li.filter(e => e.def[0] !== 'Spouse' || others.includes(e.otherPawn[0].substr(6)));

        // Now do the same for lovers, fiances, and exes (with no need for filters since we'll remove them all)
        relations.li.filter(e => loveDefs.includes(e.def[0]))
                    .map(e => e.otherPawn[0].substr(6))
                    .forEach(badId => {
                        let other = allPawns[badId].pawn;
                        other.social[0].directRelations[0].li = other.social[0].directRelations[0].li
                            .filter(e => !loveDefs.includes(e.def[0]) || e.otherPawn[0] !== 'Thing_' + pawnId);
                    });
        relations.li = relations.li.filter(e => !loveDefs.includes(e.def[0]));

// Create missing marriages
        others.filter(o => !(relations.li.filter(r => r.def[0] === 'Spouse') // get all current spouses
                                         .map(x => x.otherPawn[0].substr(6)) // map to their ids
                            ).includes(o))                                   // keep only suitors that are not already spouses
              .forEach(suitorId => {wed(pawn, suitorId)});                   // and for all of them, wed them!
    });
}

// Unilaterally wed this pawn to its suitor. Note: must be done on the suitor as well or the game will bug
// Prereq: those pawns are not already married
// Prereq: pawn must already have a relation since I don't check if the list is empty
function wed(pawn, suitorId) {
    // Add the new spouse to the relations
    pawn.social[0].directRelations[0].li.push({
        def: 'Spouse',
        otherPawn: 'Thing_' + suitorId,
        startTicks: currentTick
    });

    // Add the honeymoon and just-married thoughts, for completeness
    let memory = pawn.needs[0].needs[0].li.find(e => e.def[0] === 'Mood').thoughts[0].memories[0].memories[0];
    memory.li.push({
        def: 'GotMarried',
        sourcePrecept: null,
        otherPawn: 'Thing_' + suitorId,
        age: 0
    });
    memory.li.push({
        '$': 'Thought_MemorySocial',
        def: 'HoneymoonPhase',
        sourcePrecept: null,
        otherPawn: 'Thing_' + suitorId,
        age: 0,
        opinionOffset: 40
    });
}

/**
 * This should remove (or end) any active condition, both from the story teller or the map.
 */
function removeGameConditions(savegame) {
    let activeConditions = savegame.game[0].world[0].gameConditionManager[0].activeConditions[0].li;

    // Check if there are any at all
    if (typeof activeConditions === 'object') {
        let n = activeConditions.length;
        while (n --> 0) {
            if (badGameConditions.includes(getClazz(activeConditions[n]))) {
                if (!activeConditions[n].hasOwnProperty('duration'))
                    activeConditions.splice(n, 1);       // No duration, just remove it entirely
                else
                    activeConditions[n].duration[0] = 1; // else, set a duration of 1 tick so we still get ingame message
            }
        }
    }

    // Now, each map has its own condition manager
    savegame.game[0].maps[0].li.forEach(map => {
        activeConditions = map.gameConditionManager[0].activeConditions[0].li;
        if (typeof activeConditions === 'object') {
            n = activeConditions.length;
            while (n --> 0) {
                if (badGameConditions.includes(getClazz(activeConditions[n]))) {
                    if (!activeConditions[n].hasOwnProperty('duration'))
                        activeConditions.splice(n, 1);
                    else
                        activeConditions[n].duration[0] = 1;
                }
            }
        }
    });
}

/**
 * This should remove bad lord jobs, like prison breaks or slave rebellions.
 * Note: this function is a bit dangerous, use with care. That's because:
 *   1. I don't yet fully understand the mechanism of lord jobs
 *   2. Removing the job may lead to undefined references (crash) if it's still reference somewhere
 *   3. Lord jobs are often triggered for good reasons, so removing it does not prevent it from reappearing
 */
function removeBadLordJobs(savegame) {
    savegame.game[0].maps[0].li.forEach(map => {
        let jobs = map.lordManager[0].lords[0];
        jobs.li = jobs.li.filter(job => {
            let clazz = getClazz(job.lordJob[0]);
            // TODO: find where the prison break is stored
            return !["LordJob_SlaveRebellion"].includes(clazz);
        });
    });
}

/* Condition classes
<li Class="GameCondition_HeatWave"> (<def>HeatWave</def>)
<li Class="GameCondition_ColdSnap">
<li Class="GameCondition_PsychicEmanation">
<li Class="GameCondition_DisableElectricity">
<li>ThreatReward_GameCondition_ItemPod</li> ?
*/

/* List of lord jobs so far:
LordJob_AssaultColony
LordJob_AssaultThings
LordJob_BestowingCeremony
LordJob_DefendBase
LordJob_DefendPoint
LordJob_EscortPawn
LordJob_ExitMapBest
LordJob_Joinable_Orgy
LordJob_Ritual_Gangbang
LordJob_SlaveRebellion
LordJob_SleepThenAssaultColony
LordJob_SleepThenMechanoidsDefend
LordJob_StageThenAttack
LordJob_TradeWithColony
LordJob_Venerate
LordJob_WaitForEscort
*/

/**
 * Whatever I do, whatever mod I use (like CommonSense), I ALWAYS end up having a stack of lavish meal corrupted with
 * the wrong ingredients (e.g. all the meat disappear and get replaced with berries, while I don't have any berry on the map).
 * So now, I simply rewrite all lavish meals. I'm not here to fix the bugs in the game.
 * Note: this only fixes meal stacks, not meals that are being carried, nor those in inventories, or anywhere else.
 * To fix all meals, I would need to use xpath but unfortunately, the implementation on node is still pretty bad as of today,
 * so I'd rather not add a buggy library in the dependencies.
 */
function fixMeal(thing) {
    if (thing.hasOwnProperty('poisonPct')) {
        delete thing.poisonPct;
        delete thing.cause;
    }
    thing.ingredients[0].li = ['Meat_Thrumbo', 'Meat_Megasloth', 'RawPotatoes'];
}