---
title: Hello, Python!
slug: jb-hello-python
summary: Write and run your first real line of code. No install needed.
sort: 1
free: true
xp: 20
kind: lesson
minutes: 8
---
## Meet Python 🐍

**Python** is a real programming language. It's used to build YouTube, Instagram, NASA tools and AI. And it's one of the easiest languages to start with!

In blocks, you dragged pieces together. In Python, you **type** the instructions.

## Your first program

The `print()` command shows a message on the screen. Press **▶ Run**:

```python
print("Hello, world! 🌍")
```

🎉 You're officially a Python programmer!

## Make it yours

Change the message inside the quotes `" "` to your name, then press Run again.

```python
print("My name is ______")
print("I am learning Python!")
print("🚀🚀🚀")
```

> 💡 **Rules of print:** words go inside **quotes** `" "`, and the quotes go inside **brackets** `( )`. Forget one and Python will show a red error. That's just a bug. Fix it and run again!

## Python can do maths ➕

Numbers **don't** need quotes. Try these:

```python
print(7 + 5)
print(10 - 3)
print(6 * 4)     # * means multiply
print(20 / 4)    # / means divide
```

```reveal
What's the difference between print("2 + 2") and print(2 + 2)?
`print("2 + 2")` shows the **text** `2 + 2` exactly as written.

`print(2 + 2)` does the **maths** and shows `4`.

Quotes = text. No quotes = Python works it out.
```

## Mini challenge 🏆

Write a program that prints a 3-line poem, then prints the answer to `365 * 24` (how many hours are in a year?).

```python
# Your code here!

```
===QUIZ===
Q: What does `print()` do?
- Prints on paper
* Shows something on the screen
- Deletes code
> print() displays text or numbers in the output area.

Q: Which line has NO bug?
- print(Hello)
- print("Hello)
* print("Hello")
> Text needs quotes on both sides, inside the brackets.

Q: What does `print(3 * 4)` show?
- 3 * 4
- 7
* 12
> No quotes, so Python does the maths: 3 × 4 = 12.

---
title: Variables are boxes
slug: jb-variables
summary: Store names, scores and answers in labelled boxes called variables.
sort: 2
free: true
xp: 25
kind: lesson
minutes: 10
---
## A box with a label 📦

A **variable** is like a box with a name on it. You can put something inside and use it later.

```python
score = 0
player = "Mia"
print(player, "has", score, "points")
```

Here `score` is a box holding `0`, and `player` holds `"Mia"`.

## Boxes can change 🔄

That's why they're called **vari**-ables: the value can **vary** (change).

```python
score = 0
print("Start:", score)
score = score + 10
print("Found a coin!", score)
score = score + 10
print("Another one!", score)
```

> 💡 `score = score + 10` means: take what's in the box, add 10, put the new number back in the box.

## Ask the user: input() 🎤

`input()` asks a question and waits for an answer. Run this and type your name in the pop-up box:

```python
name = input("What's your name? ")
print("Welcome to the coding club,", name, "!")
```

## Numbers from input

`input()` always gives back **text**. To do maths, turn it into a number with `int()`:

```python
age = int(input("How old are you? "))
print("Next year you will be", age + 1)
print("In 10 years you will be", age + 10)
```

```reveal
What happens if you remove int( ) ?
You get an error! Python can't add the **text** "11" to the **number** 1. `int()` converts the text into a whole number so maths works.
```

## Challenge 🏆 Robot name generator

Ask for the user's favourite colour and favourite animal, then print their robot name, like **"Robo-Blue-Tiger"**.

```python
colour = input("Favourite colour? ")
animal = input("Favourite animal? ")
# print the robot name here!

```
===QUIZ===
Q: A variable is like…
* a labelled box that stores a value
- a type of loop
- a printer
> Variables store data we want to use later.

Q: After this code, what is in `coins`? `coins = 5` then `coins = coins + 3`
- 5
- 3
* 8
> Take 5, add 3, store 8 back in coins.

Q: Why do we use `int(input(...))` for age?
- To make it shorter
* input() gives text, int() turns it into a number
- int() makes it print
> Text can't do maths, so we convert it to an integer (whole number).

---
title: Make decisions with if
slug: jb-if-else
summary: Teach your program to choose. If this, do that. Else, do something else.
sort: 3
free: true
xp: 30
kind: lesson
minutes: 12
---
## Programs that think 🤔

Games make decisions all the time: **if** you touch lava, you lose a life. **If** you get 100 coins, you level up.

In Python we use `if`:

```python
coins = 120
if coins >= 100:
    print("LEVEL UP! 🎉")
print("Game continues…")
```

> 💡 Two important rules: put a **colon** `:` at the end of the `if` line, and **indent** (4 spaces) the lines that belong inside it.

## if… else

`else` runs when the `if` is **not** true:

```python
answer = input("What is 7 x 8? ")
if answer == "56":
    print("Correct! +10 XP ⚡")
else:
    print("Not quite. It's 56!")
```

Notice `==` (two equals) means **"is it equal?"** while `=` (one equal) means **"put into the box"**.

## Comparison cheat sheet

| Symbol | Means |
|---|---|
| `==` | equal to |
| `!=` | not equal to |
| `>` | greater than |
| `<` | less than |
| `>=` | greater than or equal to |
| `<=` | less than or equal to |

## More choices: elif

```python
marks = int(input("Your test mark out of 100: "))
if marks >= 90:
    print("A* 🌟 Amazing!")
elif marks >= 70:
    print("A 🔥 Great work!")
elif marks >= 50:
    print("B 👍 Good job")
else:
    print("Keep practising 💪")
```

```reveal
What prints if marks is 70?
`A 🔥 Great work!` The first check (>= 90) is false, the second (>= 70) is **true**, so Python stops there.
```

## Challenge 🏆 Ticket machine

A cinema ticket costs ৳150 for under-12s and ৳300 for everyone else. Ask for an age and print the price.

```python
age = int(input("How old are you? "))
# your if / else here

```
===QUIZ===
Q: What goes at the end of an `if` line?
- ;
* :
- .
> A colon tells Python a block of indented code is coming.

Q: Which checks if `x` is equal to 10?
- x = 10
* x == 10
- x => 10
> == compares. A single = stores a value.

Q: `temp = 35`. What prints? `if temp > 30: print("Hot")` `else: print("Nice")`
* Hot
- Nice
- Both
> 35 is greater than 30, so the if-block runs.

---
title: Loops in Python
slug: jb-loops-python
summary: for and while loops, so the computer does the boring repeating for you.
sort: 4
free: false
xp: 35
kind: lesson
minutes: 14
---
## Remember Robo's loops? 🔁

In the maze, **➡️ × 5** repeated a move. Python has loops too!

## The for loop

```python
for i in range(5):
    print("I love coding! 💚")
```

`range(5)` gives the numbers **0, 1, 2, 3, 4**: five numbers, so the loop runs 5 times.

## Using the loop number

```python
for i in range(1, 11):
    print(i, "x 7 =", i * 7)
```

`range(1, 11)` counts from 1 up to (but **not including**) 11.

> 💡 Countdown trick: `range(10, 0, -1)` counts **down** from 10 to 1.

```python
for n in range(10, 0, -1):
    print(n)
print("🚀 Lift off!")
```

## The while loop

A `while` loop keeps going **while** something is true. Great when you don't know how many times you need:

```python
secret = "dragon"
guess = ""
tries = 0
while guess != secret:
    guess = input("Guess the password: ")
    tries = tries + 1
print("Unlocked in", tries, "tries! 🔓")
```

> ⚠️ If the condition never becomes false, the loop runs forever: an **infinite loop**. Our playground stops it for you, but be careful!

## Totals with a loop

```python
total = 0
for i in range(1, 101):
    total = total + i
print("1 + 2 + ... + 100 =", total)
```

```reveal
Fun fact about that answer
It's **5050**. A famous mathematician, Gauss, worked this out in his head as a kid by pairing numbers: 1+100, 2+99, 3+98… that's 50 pairs of 101!
```

## Challenge 🏆 Star pyramid

Use a loop to print:

```
*
**
***
****
*****
```

```python
# Hint: "*" * 3 gives "***"
for i in range(1, 6):
    pass  # replace pass with your print

```
===QUIZ===
Q: How many times does `for i in range(4):` run?
- 3
* 4
- 5
> range(4) gives 0, 1, 2, 3: four numbers.

Q: Which loop is best when you DON'T know how many repeats you need?
- for
* while
> while keeps going until its condition becomes false.

Q: What is the last number printed by `for n in range(1, 6): print(n)`?
- 6
* 5
- 1
> range stops just before the end value, so it goes 1 to 5.

---
title: "Boss level: Build a quiz game"
slug: jb-boss-quiz-game
summary: Combine variables, input, if and loops into a real game you can share.
sort: 5
free: false
xp: 80
kind: project
minutes: 25
---
## 👾 BOSS LEVEL

Time to use **everything**: variables, input, if/else and loops. You're building a **quiz game** that keeps score!

## Step 1: Ask one question

```python
score = 0
answer = input("What is the capital of Bangladesh? ")
if answer.lower() == "dhaka":
    print("✅ Correct!")
    score = score + 1
else:
    print("❌ It's Dhaka!")
print("Score:", score)
```

> 💡 `.lower()` turns the answer into small letters, so "DHAKA", "Dhaka" and "dhaka" all count.

## Step 2: Many questions with lists

Instead of copying the code again and again, store questions and answers in **lists** and loop over them:

```python
questions = ["What is 9 x 9? ", "How many legs does a spider have? ", "What planet do we live on? "]
answers = ["81", "8", "earth"]

score = 0
for i in range(len(questions)):
    reply = input(questions[i])
    if reply.lower().strip() == answers[i]:
        print("✅ Nice!")
        score = score + 1
    else:
        print("❌ The answer was", answers[i])

print("You scored", score, "out of", len(questions))
```

## Step 3: Add a rating

After the loop, add an `if/elif/else` that prints a rating:

- full marks → "🏆 Quiz Legend!"
- at least half → "🔥 Great job!"
- otherwise → "💪 Practise and try again!"

## Step 4: Make it YOURS 🎨

- Change the questions to your favourite topic (football, Minecraft, space…)
- Add at least **5** questions
- Bonus: give **2 points** for hard questions

```python
# 👾 Build your final quiz game here!

```

## Show it off 📣

Copy your code, send it to your teacher on WhatsApp, and challenge your friends and family to beat your quiz!
===QUIZ===
Q: Why do we use `.lower()` on the answer?
- To make it shorter
* So capital letters don't matter
- To delete it
> "Dhaka" and "dhaka" become the same, so both are marked correct.

Q: What does `len(questions)` give for a list of 3 questions?
- 2
* 3
- 4
> len() counts the items in a list.

Q: Which part of the game repeats for every question?
* The code inside the for loop
- The final print
- Setting score = 0
> Everything indented under the for loop runs once per question.
