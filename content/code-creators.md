---
title: "Lists: store many things at once"
slug: cc-lists
summary: One variable, many values. Add, remove, loop and find things in a list.
sort: 1
free: true
xp: 30
kind: lesson
minutes: 12
---
## One box, many items 🎒

A variable holds **one** value. A **list** holds **many**, in order.

```python
squad = ["Rafi", "Nusaiba", "Arian", "Zara"]
print(squad)
print("Captain:", squad[0])
print("Squad size:", len(squad))
```

> 💡 Lists start counting at **0**, not 1. So `squad[0]` is the first item and `squad[3]` is the fourth.

## Change a list

```python
playlist = ["Song A", "Song B"]
playlist.append("Song C")      # add to the end
playlist.insert(0, "Intro")    # add at position 0
playlist.remove("Song B")      # remove by value
print(playlist)
print("Last song:", playlist[-1])   # -1 = last item
```

## Loop through a list

```python
scores = [72, 88, 95, 61, 79]
for s in scores:
    if s >= 80:
        print(s, "⭐ distinction")
    else:
        print(s)
print("Highest:", max(scores))
print("Average:", sum(scores) / len(scores))
```

## Is it in the list?

```python
banned = ["spam", "scam", "virus"]
word = input("Type a word: ").lower()
if word in banned:
    print("🚫 Blocked!")
else:
    print("✅ Allowed")
```

```reveal
What does scores[1] give in the list [72, 88, 95, 61, 79]?
**88**. Index 0 is 72, index 1 is 88. Off-by-one mistakes are the most common bug in coding!
```

## Challenge 🏆 Shopping list app

Make a program that keeps asking for items to add to a list until the user types `done`, then prints the list and how many items it has.

```python
shopping = []
# your while loop here

```
===QUIZ===
Q: What is `["a", "b", "c"][0]`?
* "a"
- "b"
- an error
> Lists start at index 0.

Q: Which adds "kiwi" to the END of a list called `fruits`?
- fruits.add("kiwi")
* fruits.append("kiwi")
- fruits = "kiwi"
> append() adds one item to the end of the list.

Q: What does `len([4, 8, 15, 16])` give?
- 3
* 4
- 16
> len() counts the items: there are 4.

---
title: "Functions: make your own commands"
slug: cc-functions
summary: Package code into reusable commands with def, parameters and return.
sort: 2
free: true
xp: 35
kind: lesson
minutes: 14
---
## Build your own command 🧩

You already use functions like `print()`, `len()` and `input()`. Now you'll **make your own** with `def`.

```python
def greet():
    print("👋 Hey there!")
    print("Welcome back, coder.")

greet()
greet()
```

Write once, use as many times as you like!

## Parameters: give it information

```python
def greet(name):
    print("👋 Hey", name + "!")

greet("Ayaan")
greet("Tasnia")
```

`name` is a **parameter**: a variable the function receives.

## return: give back an answer

```python
def area_of_rectangle(width, height):
    return width * height

room = area_of_rectangle(4, 5)
print("Room area:", room, "m²")
print("Door area:", area_of_rectangle(1, 2), "m²")
```

> 💡 `print` **shows** a value. `return` **hands it back** so you can store it or use it in more maths.

## A useful function

```python
def grade(mark):
    if mark >= 90:
        return "A*"
    elif mark >= 80:
        return "A"
    elif mark >= 70:
        return "B"
    elif mark >= 60:
        return "C"
    else:
        return "U"

for m in [95, 82, 67, 40]:
    print(m, "→", grade(m))
```

## Why functions? 🤔

- **Less repeating**: write once, call anywhere
- **Easier to fix**: one bug fix fixes every use
- **Teamwork**: different people can write different functions

```reveal
What's the output of: def double(x): return x * 2 … print(double(double(3)))
**12**. double(3) gives 6, then double(6) gives 12.
```

## Challenge 🏆

Write a function `is_even(n)` that returns `True` if n is even and `False` if not. Hint: `n % 2` gives the remainder after dividing by 2.

```python
def is_even(n):
    pass  # replace with your code

print(is_even(4))   # should print True
print(is_even(7))   # should print False
```
===QUIZ===
Q: Which keyword creates a function in Python?
- function
* def
- make
> def is short for define.

Q: In `def add(a, b):`, what are `a` and `b`?
* parameters
- loops
- lists
> Parameters are the inputs a function receives.

Q: What's the difference between print and return?
- They are the same
* print shows a value; return sends it back to be used
- return shows it in red
> Returned values can be stored in variables or used in calculations.

---
title: Build your first web page
slug: cc-first-web-page
summary: HTML for structure, CSS for style, a dash of JavaScript for action.
sort: 3
free: true
xp: 30
kind: lesson
minutes: 15
---
## Every website is made of 3 languages 🌐

| Language | Job | Like a… |
|---|---|---|
| **HTML** | Structure: headings, text, images, buttons | skeleton 🦴 |
| **CSS** | Style: colours, fonts, layout | clothes 👕 |
| **JavaScript** | Action: clicks, games, changes | muscles 💪 |

## HTML: tags

HTML uses **tags** in angle brackets. Most come in pairs: an opening `<h1>` and a closing `</h1>`. Edit the code on the left and watch the preview update live:

```web
<h1>My Awesome Page</h1>
<p>Hi! I'm learning to build websites.</p>
<h2>My favourite things</h2>
<ul>
  <li>Football ⚽</li>
  <li>Coding 💻</li>
  <li>Biryani 🍛</li>
</ul>
```

## CSS: make it pretty

```web
<style>
  body { font-family: sans-serif; background: #fff6e6; padding: 20px; }
  h1 { color: #6c47ff; font-size: 40px; }
  .card { background: white; border: 3px solid black; border-radius: 16px; padding: 16px; box-shadow: 5px 5px 0 black; }
</style>

<h1>About Me</h1>
<div class="card">
  <p>I'm in Class 7 and I want to be a game developer.</p>
</div>
```

> 💡 In CSS, you pick **what** to style (`h1`, `.card`), then list **properties** like `color` and `background` inside `{ }`.

## JavaScript: make it do stuff

```web
<style>
  body { font-family: sans-serif; text-align: center; padding-top: 30px; }
  button { font-size: 22px; padding: 12px 22px; border-radius: 12px; cursor: pointer; }
</style>

<h1 id="msg">Are you ready?</h1>
<button onclick="go()">Click me</button>

<script>
  function go() {
    const moods = ["🔥 Let's go!", "😎 Too easy", "🚀 To the moon", "🧠 Big brain"];
    const pick = moods[Math.floor(Math.random() * moods.length)];
    document.getElementById("msg").textContent = pick;
  }
</script>
```

## Challenge 🏆 Your profile card

Build a page about yourself with: a heading, a photo or emoji, a list of 3 hobbies, a styled card, and a button that changes the background colour when clicked.

```web
<!-- Build your profile page here -->
<h1>Hi, I'm ...</h1>
```
===QUIZ===
Q: Which language controls colours and fonts?
- HTML
* CSS
- JavaScript
> CSS is for style. HTML is structure, JavaScript is behaviour.

Q: What is the closing tag for `<p>`?
- <p/>
* </p>
- <close p>
> Closing tags have a forward slash before the name.

Q: Which language makes a button DO something when clicked?
- HTML
- CSS
* JavaScript
> JavaScript adds interaction and logic to web pages.

---
title: How the internet moves your data
slug: cc-how-the-internet-works
summary: Packets, IP addresses, routers and why your video doesn't arrive in one piece.
sort: 4
free: false
xp: 30
kind: lesson
minutes: 12
---
## What happens when you open YouTube? 📺

Your video doesn't travel as one big file. It's chopped into thousands of tiny pieces called **packets**. 📦📦📦

## Packets 📦

Each packet carries:

| Part | What's in it |
|---|---|
| **Header** | Where it's from, where it's going (IP addresses), and its number in the sequence |
| **Payload** | A small piece of the actual data |
| **Trailer** | A check to spot if anything got damaged |

Packets can take **different routes** and arrive in the wrong order. Your device puts them back together using the sequence numbers. 🧩

## IP addresses 🏠

Every device on the internet has an **IP address**, like a home address for computers. For example: `192.168.1.24` (IPv4).

## Routers 🚦

**Routers** are like traffic police. They read each packet's destination and send it along the best path toward it.

```reveal
Why split data into packets instead of sending one big file?
- If one packet is lost, only that small piece is re-sent, not the whole file
- Packets can avoid busy or broken routes
- Many people can share the same network at the same time
```

## DNS: the internet's phone book 📖

You type `youtube.com`, but computers need an IP address. A **DNS server** looks up the name and returns the IP address. Then your browser can connect.

> 💡 **O Level preview:** this topic grows into *Data transmission* and *The internet and its uses* in the O Level 2210 syllabus.

## Act it out 🎭

With friends: write a message on 5 slips of paper, number them, and pass them through different people to a receiver. Can they rebuild the message in order?
===QUIZ===
Q: Data sent over the internet is broken into small pieces called…
- bits
* packets
- routers
> Packets travel separately and are reassembled at the destination.

Q: Which part of a packet contains the destination address?
* Header
- Payload
- Trailer
> The header holds addressing info and the sequence number.

Q: What does DNS do?
- Speeds up Wi-Fi
* Turns a website name into an IP address
- Blocks viruses
> DNS works like a phone book, matching names to IP addresses.

---
title: "Boss level: Number guessing game"
slug: cc-boss-guessing-game
summary: Random numbers, while loops, functions and a high score. Your first real game.
sort: 5
free: false
xp: 80
kind: project
minutes: 25
---
## 👾 BOSS LEVEL: Guess the number

The computer picks a secret number from 1 to 100. You guess, and it says **higher** or **lower**. Fewer guesses = better score!

## Step 1: Random numbers

```python
import random
secret = random.randint(1, 100)
print("I picked", secret)   # we'll hide this later!
```

## Step 2: The game loop

```python
import random

secret = random.randint(1, 100)
guesses = 0
guess = 0

print("🎯 I'm thinking of a number from 1 to 100…")
while guess != secret:
    guess = int(input("Your guess: "))
    guesses = guesses + 1
    if guess < secret:
        print("⬆️ Higher!")
    elif guess > secret:
        print("⬇️ Lower!")

print("🎉 Got it in", guesses, "guesses!")
```

## Step 3: Level up the game

Add these upgrades one at a time. Test after each one!

1. **Rating**: 1–5 guesses "🧠 Genius", 6–8 "🔥 Great", 9+ "🐢 Keep practising"
2. **Validation**: if the guess is outside 1–100, print a warning and don't count it
3. **Function**: move the game into `def play():` and return the number of guesses
4. **Play again**: after a game, ask `Play again? (y/n)` and loop
5. **High score**: remember the fewest guesses across games

```python
import random

def play():
    secret = random.randint(1, 100)
    guesses = 0
    # your upgraded game here
    return guesses

best = None
# your play-again loop here

```

```reveal
Pro strategy: what's the smartest way to guess?
Always guess the **middle** of what's left: 50, then 25 or 75, and so on. Each guess cuts the possibilities in half, so you'll never need more than **7 guesses** for 1–100. Computer scientists call this **binary search**. You'll meet it again in O Level!
```
===QUIZ===
Q: What does `random.randint(1, 6)` do?
* Picks a random whole number from 1 to 6
- Always gives 6
- Rolls 6 dice
> randint includes both ends of the range.

Q: Why does the game use a `while` loop?
- It's shorter than if
* We don't know how many guesses the player will need
- for loops can't use input
> while keeps looping until the guess is correct.

Q: Halving the range on every guess is called…
- bubble sort
* binary search
- linear search
> Binary search is super fast because it cuts the search area in half each time.
