---
title: What is an algorithm?
slug: exp-what-is-an-algorithm
summary: A fancy word for a simple idea, and why computers need super-clear steps.
sort: 1
free: true
xp: 20
kind: lesson
minutes: 8
---
## A big word for a simple idea 🧠

An **algorithm** is a set of steps to solve a problem or finish a job.

You already follow algorithms every day:

- 🪥 brushing your teeth
- 🥪 making a sandwich
- 🚦 crossing the road

## Computers need VERY clear steps

Imagine telling a robot how to make a jam sandwich 🥪. You say:

> "Put jam on the bread."

The robot puts the **whole jar** on the bread! 🫙🍞 Oops.

Computers do *exactly* what we say, not what we mean. So our steps must be clear and in the right order.

```reveal
Write better steps for the robot
1. Open the jar of jam.
2. Pick up the knife.
3. Scoop a little jam with the knife.
4. Spread the jam on one slice of bread.
5. Put the second slice on top.

Did you remember to **open the jar**? Lots of people forget!
```

## Your turn: the robot game 🤖

Play with a friend or a grown-up. One person is the **robot**. The other gives instructions to walk to the door. The robot must do *exactly* what is said, no guessing!

Did your instructions work first time? If not, you found a **bug** 🐞 and that's how coders learn.

## Try it on Robo

Write an algorithm (a program) to get Robo to the star.

```botmaze
{"grid":["S.#.","..#.","#...","#.#G"], "best": 6, "hint": "Look for the path down the middle, then across."}
```
===QUIZ===
Q: An algorithm is…
- a type of robot
* a set of steps to solve a problem
- a computer game
> An algorithm is a list of steps. A recipe is an algorithm for cooking!

Q: Why must instructions for a computer be very clear?
- Computers like long words
* Computers do exactly what we say
- Computers can read our minds
> Computers follow instructions exactly, so unclear steps cause bugs.

Q: You forgot "open the jar" in your sandwich algorithm. This is called a…
* bug
- loop
- pattern
> A mistake in an algorithm or program is a bug. Debugging means fixing it!

---
title: Debug Detective
slug: exp-debug-detective
summary: Someone wrote a broken program. Find the bug and fix it!
sort: 2
free: true
xp: 25
kind: game
minutes: 8
---
## Calling all detectives 🕵️

A **bug** is a mistake in a program. **Debugging** means finding and fixing it.

Even the best programmers in the world write bugs every day. The trick is being a good detective!

## The case of the lost robot

Zara wanted Robo to reach the ⭐. She wrote this program:

**➡️ ➡️ ⬇️ ⬅️ ⬅️**

But Robo bonked into a wall! 💥

```botmaze
{"grid":["S..","##.","G.."], "best": 6, "hint": "Try Zara's program first. Where does Robo bonk? What's missing?"}
```

```reveal
Detective's answer
Zara's program only goes **down once**, so Robo turns left too early and hits the wall. Robo needs to go down **twice** to reach the bottom row.

Fixed program: ➡️ ➡️ ⬇️ ⬇️ ⬅️ ⬅️
```

## Detective tips 🔍

1. **Run it** and watch carefully.
2. **Find where** it goes wrong. Which step?
3. **Fix one thing** at a time.
4. **Test again!**

> 💡 Real coders say: "It's not a failure, it's a clue!"
===QUIZ===
Q: Debugging means…
- adding more bugs
* finding and fixing mistakes
- deleting the program
> Debug = remove the bug!

Q: What's the best first step when a program goes wrong?
* Run it and watch where it goes wrong
- Give up
- Delete everything
> Watching carefully shows you which step has the bug.

---
title: "Loops: repeat it!"
slug: exp-loops
summary: Why tap the same arrow 5 times? Loops make programs shorter.
sort: 3
free: true
xp: 30
kind: game
minutes: 10
---
## Lazy coders are clever coders 😎

Look at this program:

**➡️ ➡️ ➡️ ➡️ ➡️**

That's a lot of arrows! What if we could say **"go right, 5 times"**?

That's a **loop**. A loop **repeats** instructions.

**➡️ × 5** ✨ One block instead of five!

## Loop power-up unlocked 🔁

In this maze, each arrow has a **+** and **−** button. Use **+** to repeat a move.

Can you solve it with only **3 blocks**?

```botmaze
{"grid":["S.....","#####.","#####.","G....."], "loops": true, "best": 3, "hint": "Right ×5, down ×3, left ×5"}
```

## Loops in real life 🌍

- 🏃 "Run 3 laps of the field"
- 👏 "Clap 10 times"
- 🎵 The chorus of a song repeats!

```reveal
How many times does this loop clap? "Repeat 4 times: clap clap"
**8 claps!** The loop runs 4 times, and each time you clap 2 times. 4 × 2 = 8 👏
```
===QUIZ===
Q: A loop is used to…
- stop a program
* repeat instructions
- draw a circle
> Loops repeat steps so we don't write them again and again.

Q: Which is shorter?
- ⬇️ ⬇️ ⬇️ ⬇️
* ⬇️ × 4
> Same result, fewer blocks. That's the magic of loops!

Q: "Repeat 3 times: jump". How many jumps?
- 1
* 3
- 6
> The loop runs 3 times, one jump each time.

---
title: Computers all around us
slug: exp-computers-around-us
summary: Input, process, output. Discover how every computer works.
sort: 4
free: false
xp: 25
kind: lesson
minutes: 10
---
## Spot the computer 🔎

Computers aren't just laptops! They hide in:

📱 phones · 🎮 game consoles · 🚗 cars · 🧺 washing machines · 🚦 traffic lights · ⌚ smart watches

## Every computer does 3 things

| Step | What it means | Example: a calculator |
|---|---|---|
| **Input** ⌨️ | Information goes in | You press 2 + 3 |
| **Process** ⚙️ | The computer works on it | It adds the numbers |
| **Output** 📺 | A result comes out | The screen shows 5 |

## Input or output?

```reveal
Keyboard ⌨️
**Input**: you type information *into* the computer.
```

```reveal
Speaker 🔊
**Output**: sound comes *out* of the computer.
```

```reveal
Microphone 🎤
**Input**: your voice goes *into* the computer.
```

```reveal
Printer 🖨️
**Output**: paper comes *out*!
```

> 💡 A **touchscreen** is both! You touch it (input) and it shows pictures (output).

## Mini project: Be a computer 🤖

Ask a friend to say two numbers (**input**). Add them in your head (**process**). Shout the answer (**output**). You just behaved like a computer!
===QUIZ===
Q: A mouse is an…
* input device
- output device
> You move and click the mouse to send information into the computer.

Q: What does a computer do between input and output?
- Sleep
* Process
- Print
> Input → Process → Output. Processing is the computer doing the work.

Q: Which one is BOTH input and output?
- Keyboard
- Speaker
* Touchscreen
> You touch it (input) and it shows you things (output).
