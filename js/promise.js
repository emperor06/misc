#!/bin/node

let BUG = process.argv[2] == "bug"

async function longTask() {
  return new Promise((good, bad) => {
    console.log("(long task is working …)")
    setTimeout(() => {
      console.log("Computation done. The result is ready.")
      if (BUG) bad("Ça bug !")
      else     good("C'est bon !")
    }, 1000)
  })
}

console.log("Executing a long task …")
const prom = longTask()
console.log("while doing something else.")

prom.then(
  (gagne) => console.log(`Received: ${gagne}\nC'est gagné`),
  (perdu) => console.log(`Received: ${perdu}\nC'est raté`)
)

console.log("That's All Falks! The result will come eventually.")
