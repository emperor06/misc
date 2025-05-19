/**
 * Fix Rimworld savegame things dumper
 * by Drax
 */


if (process.argv.length != 3) {
    console.log('Error: missing argument (or too many arguments)')
    console.log(`Usage: node(.exe) parsethings.js savegame.rms`);
    process.exit(1);
}


const
  FILE = process.argv[2],
  fs = require('fs'),
  xml2js = require('xml2js'),
  parser = new xml2js.Parser(),


fs.readFile(FILE, function(err, data) {
    parser.parseString(data, function (err, result) {

        // Loop all objects on map and find colonists
        result.savegame.game[0].maps[0].li[0].things[0].thing
            //.filter(isColonist)
            .forEach(processThing);

        return;

        const builder = new xml2js.Builder({
            xmldec: { version: "1.0", encoding: "utf-8" },
            renderOpts: { 'pretty': true, 'indent': '\t', 'newline': '\r\n', 'spacebeforeslash': ' ' }
            });

        fs.writeFile('extracted.rws', '\ufeff' + xml, {encoding: 'utf8'}, function(err) {
            if (err) return console.log(err);
            console.log("Done!");
        });

    });
});

function processThing(thing) {

}

function isColonist(thing) {
    return thing.def.includes('Human')
        && thing.hasOwnProperty('faction')
        && thing.faction.includes('Faction_13')
        && !isPrisoner(thing);
}

function isPrisoner(thing) {
    return thing.hasOwnProperty('guest')
        && thing.guest[0].hasOwnProperty('guestStatus')
        && thing.guest[0].guestStatus[0] == 'Prisoner';
}

function isGoodHediff(hediff) {
    return !(      hediff.hasOwnProperty("$")
                && badHediffClasses.includes(hediff.$.Class)
            || badHediffDefs.includes(hediff.def[0]));
}

function processPawn(pawn) {
    displayNick(pawn);
    repairApparel(pawn);
    heal(pawn);
    fulfillNeeds(pawn);
}

function displayNick(pawn) {
    console.log(pawn.name[0].nick[0]);
}

function heal(pawn) {
    let tracker = pawn.healthTracker[0];

    // Should we resurrect the dead? -> delete healthState regardless of its value
    // Actually no, that's more complicated than that. The dead must be brought back
    // to the list of living things and some other values are to be changed.
    if (tracker.hasOwnProperty("healthState") && tracker.healthState[0] === "Down")
        delete tracker.healthState;

    // Remove bad hediffs (wounds, sickness, babies)
    tracker.hediffSet[0].hediffs[0].li = tracker.hediffSet[0].hediffs[0].li.filter(isGoodHediff);
}

function repairApparel(pawn) {
    // not yet implemented
}

function fulfillNeeds(pawn) {
    let needs = pawn.needs[0].needs[0].li;
    needs.forEach(e => {
        // Set level to 1
        e.curLevel = [1];

        // for Joy, reset tolerance to zero
        if (e.def[0] === "Joy") {
            e.tolerances[0].vals[0].li.fill(0);
            e.bored[0].vals[0].li.fill("False");
        // for Mood, fix bad memories
        } else if (e.def[0] === "Mood") {
            let memory = e.thoughts[0].memories[0].memories[0];
            memory.li = memory.li.filter(mem => !(badMemories.includes(mem.def[0])));
        }
    });
}
