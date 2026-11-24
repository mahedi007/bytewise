---
title: "Data representation: binary & denary"
slug: ol-binary-denary
summary: "Paper 1 · Topic 1. Why computers use binary, place values, and fast conversions both ways."
sort: 1
free: true
xp: 30
kind: lesson
minutes: 15
---
## Why binary? ⚡

Computers are built from billions of tiny switches called **transistors**. A switch has only two states: **off (0)** and **on (1)**. So all data inside a computer (numbers, text, images, sound) is stored as **binary**: base 2.

- **Bit** = one binary digit, 0 or 1
- **Nibble** = 4 bits
- **Byte** = 8 bits

## Place values

In denary (base 10) each column is worth 10× the one to its right. In binary each column is worth **2×**:

| 128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|---|---|---|---|---|---|---|---|
| 0 | 0 | 1 | 0 | 1 | 1 | 0 | 1 |

32 + 8 + 4 + 1 = **45**

Play with the switches. Flip bits on and off and watch the denary value change. Can you hit the challenge number?

```binary
{"bits": 8, "target": 45}
```

## Binary ➜ denary

Add up the place values wherever there's a **1**.

```reveal
Convert 10010110 to denary
128 + 16 + 4 + 2 = **150**
```

## Denary ➜ binary (subtraction method)

Start at 128. If the number is **at least** the place value, write 1 and subtract. Otherwise write 0. Move right.

Example: **200**

| Step | Left | Column | Bit |
|---|---|---|---|
| 200 ≥ 128 | 72 | 128 | 1 |
| 72 ≥ 64 | 8 | 64 | 1 |
| 8 < 32 | 8 | 32 | 0 |
| 8 < 16 | 8 | 16 | 0 |
| 8 ≥ 8 | 0 | 8 | 1 |
| 0 | 0 | 4, 2, 1 | 0 0 0 |

200 = **11001000**

```reveal
Convert 99 to 8-bit binary
64 + 32 + 2 + 1 = 99 → **01100011**
```

## Check your answers with Python 🐍

```python
print(bin(45))              # 0b101101
print(int("10010110", 2))   # 150
print(format(99, "08b"))    # 01100011 (8-bit with leading zeros)

n = int(input("Denary number (0-255): "))
print(n, "in binary is", format(n, "08b"))
```

## Range of values

With **n** bits you can store **2ⁿ** different values, from 0 to 2ⁿ − 1.

| Bits | Values | Range |
|---|---|---|
| 4 | 16 | 0–15 |
| 8 | 256 | 0–255 |
| 16 | 65,536 | 0–65,535 |

> 🎯 **Exam tip:** always write binary answers with the number of bits asked for. If the question says *8-bit*, 45 must be `00101101`, not `101101`.
===QUIZ===
Q: What is 00110101 in denary?
- 35
* 53
- 106
> 32 + 16 + 4 + 1 = 53

Q: What is the largest denary number that can be stored in 8 bits?
- 128
- 256
* 255
> 2⁸ = 256 values, from 0 to 255.

Q: What is 18 as an 8-bit binary number?
* 00010010
- 00011000
- 10010000
> 18 = 16 + 2

Q: Why do computers use binary?
- It's easier for humans to read
* They are made of switches with only two states
- It takes up less space than denary
> Transistors are either on or off: 1 or 0.

---
title: Pseudocode survival kit
slug: ol-pseudocode-kit
summary: "Paper 2 · Topic 7–8. Cambridge pseudocode side by side with Python: variables, IF, CASE, loops and arrays."
sort: 2
free: true
xp: 35
kind: lesson
minutes: 20
---
## Why pseudocode? 📜

In **Paper 2**, you'll read, write and fix algorithms in **pseudocode**, a structured English-like language that isn't tied to any one programming language. The Cambridge style has its own keywords (always in CAPITALS) and uses **←** for assignment.

## Variables, constants and I/O

```pseudocode
DECLARE Name : STRING
DECLARE Age : INTEGER
CONSTANT VAT ← 0.15

OUTPUT "Enter your name"
INPUT Name
Age ← 16
OUTPUT "Hello ", Name
```

The same in Python:

```python
VAT = 0.15
name = input("Enter your name: ")
age = 16
print("Hello", name)
```

| Data type | Example |
|---|---|
| INTEGER | 42 |
| REAL | 3.14 |
| CHAR | 'A' |
| STRING | "Dhaka" |
| BOOLEAN | TRUE / FALSE |

## Selection: IF and CASE

```pseudocode
IF Mark >= 50
  THEN
    OUTPUT "Pass"
  ELSE
    OUTPUT "Fail"
ENDIF

CASE OF Grade
  'A' : OUTPUT "Excellent"
  'B' : OUTPUT "Good"
  OTHERWISE OUTPUT "Keep going"
ENDCASE
```

## Iteration: three kinds of loop

**Count-controlled (FOR):** you know how many times.

```pseudocode
FOR Count ← 1 TO 10
    OUTPUT Count * 2
NEXT Count
```

**Pre-condition (WHILE):** checks *before* each loop, so it might run **zero** times.

```pseudocode
WHILE Password <> "secret" DO
    INPUT Password
ENDWHILE
```

**Post-condition (REPEAT):** checks *after*, so it always runs **at least once**.

```pseudocode
REPEAT
    INPUT Number
UNTIL Number > 0
```

```reveal
Which loop would you use to validate input, and why?
**REPEAT…UNTIL** (post-condition). The user must enter a value at least once, and the loop repeats until the value is valid.
```

## Arrays

Cambridge pseudocode arrays usually start at index **1**. Python lists start at **0**.

```pseudocode
DECLARE Scores : ARRAY[1:5] OF INTEGER
FOR Index ← 1 TO 5
    INPUT Scores[Index]
NEXT Index
```

```python
scores = []
for index in range(5):
    scores.append(int(input("Score: ")))
print(scores)
```

## Operators to remember

| Pseudocode | Python | Meaning |
|---|---|---|
| ← | = | assignment |
| = | == | equal to |
| <> | != | not equal to |
| DIV | // | integer division |
| MOD | % | remainder |
| AND, OR, NOT | and, or, not | logic |

> 🎯 **Exam tip:** examiners accept any sensible pseudocode, but using the Cambridge keywords and **←** shows confidence and makes your logic easy to mark. Always indent inside IF and loops.
===QUIZ===
Q: Which loop ALWAYS runs at least once?
- FOR…NEXT
- WHILE…ENDWHILE
* REPEAT…UNTIL
> The condition is checked at the end, so the body runs at least once.

Q: In Cambridge pseudocode, what does `Total ← Total + 5` do?
* Adds 5 to Total and stores the result in Total
- Checks if Total equals Total + 5
- Outputs Total + 5
> The arrow ← means assignment.

Q: What is `17 MOD 5`?
- 3
* 2
- 3.4
> 17 ÷ 5 = 3 remainder 2. MOD gives the remainder.

Q: What is `17 DIV 5`?
* 3
- 2
- 3.4
> DIV gives the whole-number part of the division.

---
title: Logic gates & truth tables
slug: ol-logic-gates
summary: "Paper 2 · Topic 10. AND, OR, NOT, NAND, NOR, XOR: build truth tables and logic expressions."
sort: 3
free: true
xp: 35
kind: lesson
minutes: 15
---
## Gates make decisions ⚡

A **logic gate** takes one or two binary inputs (0 or 1) and gives one output. Combine gates and you get circuits that can add numbers, control alarms, or run a whole CPU.

Try every gate in the lab. Flip **A** and **B** and watch the lamp and the truth table:

```logic
{"gates": ["AND", "OR", "NOT", "NAND", "NOR", "XOR"]}
```

## The six gates

| Gate | Output is 1 when… |
|---|---|
| **NOT** | the input is 0 (it flips the input) |
| **AND** | both inputs are 1 |
| **OR** | at least one input is 1 |
| **NAND** | NOT AND: output is 0 only when both inputs are 1 |
| **NOR** | NOT OR: output is 1 only when both inputs are 0 |
| **XOR** | the inputs are **different** |

## Logic expressions

Exam questions describe circuits as expressions:

**X = (A AND B) OR (NOT C)**

To build its truth table, list all input combinations (3 inputs = 2³ = **8 rows**), then work out the middle columns step by step:

| A | B | C | A AND B | NOT C | X |
|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 1 | 1 |
| 0 | 0 | 1 | 0 | 0 | 0 |
| 0 | 1 | 0 | 0 | 1 | 1 |
| 0 | 1 | 1 | 0 | 0 | 0 |
| 1 | 0 | 0 | 0 | 1 | 1 |
| 1 | 0 | 1 | 0 | 0 | 0 |
| 1 | 1 | 0 | 1 | 1 | 1 |
| 1 | 1 | 1 | 1 | 0 | 1 |

## Check it with Python 🐍

```python
print("A B C | X")
for A in (0, 1):
    for B in (0, 1):
        for C in (0, 1):
            X = (A and B) or (not C)
            print(A, B, C, "|", int(X))
```

## From a problem statement

> A safety alarm **X** sounds if the door is open (**D = 1**) **and** the system is armed (**S = 1**), **or** if the panic button is pressed (**P = 1**).

```reveal
Write the logic expression
**X = (D AND S) OR P**
```

> 🎯 **Exam tip:** always write the 8 input rows in binary counting order (000, 001, 010 … 111). It's fast, and you'll never miss a row. Draw gate symbols with a ruler-neat shape: examiners must recognise them.
===QUIZ===
Q: Which gate outputs 1 only when BOTH inputs are 1?
* AND
- OR
- XOR
> AND needs both inputs to be 1.

Q: What is the output of XOR when A = 1 and B = 1?
* 0
- 1
> XOR outputs 1 only when the inputs are different.

Q: How many rows does a truth table with 3 inputs have?
- 6
* 8
- 9
> 2³ = 8 combinations.

Q: NAND outputs 0 when…
- both inputs are 0
* both inputs are 1
- the inputs are different
> NAND is the opposite of AND.

---
title: Hex, binary addition & overflow
slug: ol-hex-addition-overflow
summary: "Paper 1 · Topic 1. Hexadecimal, adding binary, overflow, logical shifts and two's complement."
sort: 4
free: false
xp: 40
kind: lesson
minutes: 25
---
## Hexadecimal (base 16) 🔢

Hex uses 16 symbols: **0–9** and **A–F** (A = 10 … F = 15). One hex digit = **4 bits** (a nibble), so hex is a short, readable way to write binary.

| Denary | Binary | Hex |
|---|---|---|
| 9 | 1001 | 9 |
| 10 | 1010 | A |
| 12 | 1100 | C |
| 15 | 1111 | F |

**Binary ➜ hex:** split into nibbles from the right, convert each.

`1101 0110` → D 6 → **D6**

**Hex ➜ denary:** first digit × 16 + second digit. 2F = 2 × 16 + 15 = **47**

**Where hex is used:** HTML/CSS colours (`#FF5733`), MAC addresses, error codes, assembly code and memory dumps.

> Why programmers like it: it's shorter than binary, easier to read, and fewer mistakes than long strings of 1s and 0s.

## Binary addition ➕

Rules: 0+0 = 0, 1+0 = 1, 1+1 = 0 carry 1, 1+1+1 = 1 carry 1.

```
   0 1 0 1 1 0 1 0    (90)
 + 0 0 1 1 1 0 0 1    (57)
 -----------------
   1 0 0 1 0 0 1 1    (147)
```

## Overflow 💥

An 8-bit register can only hold values up to 255. If a result needs a **9th bit**, that carry is lost: this is an **overflow error**.

```
   1 1 0 0 1 0 0 0    (200)
 + 0 1 1 0 0 1 0 0    (100)
 -----------------
 1 0 0 1 0 1 1 0 0    (300 does not fit!)
```

The 8-bit register stores `00101100` = 44. Wrong answer!

```python
a, b = 200, 100
result = (a + b) % 256      # what an 8-bit register would keep
print("Real answer:", a + b)
print("8-bit register holds:", result, format(result, "08b"))
print("Overflow!" if a + b > 255 else "No overflow")
```

## Logical shifts ↔️

- **Left shift by 1** = multiply by 2 (each shift doubles)
- **Right shift by 1** = divide by 2 (each shift halves, remainders lost)
- Bits shifted off the end are **lost**; empty spaces fill with **0**

`00010110` (22) left shift 2 → `01011000` (88)

```reveal
What is 10110100 after a logical right shift of 3? What's the problem?
`00010110` = 22. The original was 180; 180 ÷ 8 = 22.5, so the bits that fell off the right (the .5) were **lost**. Shifting left too far loses the leftmost bits and the value becomes wrong.
```

## Two's complement (negative numbers) ➖

In 8-bit two's complement, the leftmost bit is worth **−128**:

| −128 | 64 | 32 | 16 | 8 | 4 | 2 | 1 |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 1 | 0 | 1 | 1 | 0 | 0 |

−128 + 64 + 32 + 8 + 4 = **−20**

**To make a negative number:** write the positive in binary, flip every bit, add 1.

+20 = `00010100` → flip → `11101011` → +1 → `11101100` = **−20** ✅

Range for 8 bits: **−128 to +127**.
===QUIZ===
Q: What is 3C in denary?
- 36
* 60
- 312
> 3 × 16 + 12 = 60

Q: What is 11101001 in hex?
* E9
- D9
- E1
> 1110 = E, 1001 = 9

Q: An overflow error happens when…
- a number is negative
* a result is too large to fit in the available bits
- you divide by zero
> In 8 bits, anything above 255 overflows.

Q: A logical left shift of 2 places has what effect (assuming no bits are lost)?
- divides by 2
- multiplies by 2
* multiplies by 4
> Each left shift doubles: ×2 ×2 = ×4.

Q: What is 11111111 in 8-bit two's complement?
* −1
- 255
- −127
> −128 + 127 = −1

---
title: Trace tables like an examiner
slug: ol-trace-tables
summary: "Paper 2. Dry-run algorithms step by step and collect easy marks."
sort: 5
free: false
xp: 45
kind: exam
minutes: 20
---
## What's a trace table? 🔍

A **trace table** records the value of every variable, and every output, as you **dry-run** an algorithm line by line. It's in nearly every Paper 2, and it's very learnable marks.

## Worked example

```pseudocode
Total ← 0
Count ← 0
REPEAT
    INPUT Number
    IF Number > 0
      THEN
        Total ← Total + Number
        Count ← Count + 1
    ENDIF
UNTIL Number = -1
OUTPUT Total / Count
```

Input data: **5, −2, 8, 3, −1**

| Total | Count | Number | OUTPUT |
|---|---|---|---|
| 0 | 0 | | |
| 5 | 1 | 5 | |
| | | −2 | |
| 13 | 2 | 8 | |
| 16 | 3 | 3 | |
| | | −1 | 5.333… |

## Examiner habits ✍️

1. **Initialise first**: the first row shows starting values (0 here)
2. **New row** each time a value changes. Don't overwrite
3. **Only write a value when it changes**; leaving blanks is fine
4. The loop checks the condition **after** the body for REPEAT, so −1 is processed by the IF first (and ignored because it isn't > 0)
5. **Read the OUTPUT** statement carefully: is it the total, the count or the average?

## Your turn 🎯

```pseudocode
X ← 1
Y ← 0
WHILE X < 20 DO
    Y ← Y + X
    X ← X * 3
ENDWHILE
OUTPUT Y
```

```reveal
Show the completed trace table
| X | Y | OUTPUT |
|---|---|---|
| 1 | 0 | |
| 3 | 1 | |
| 9 | 4 | |
| 27 | 13 | |
| | | 13 |

After X becomes 27, the WHILE condition (27 < 20) is false, so the loop stops and 13 is output.
```

## Verify with Python 🐍

Convert the algorithm to Python and print the variables every loop. It's a great way to check your trace table while revising:

```python
X = 1
Y = 0
print("X", "Y")
print(X, Y)
while X < 20:
    Y = Y + X
    X = X * 3
    print(X, Y)
print("OUTPUT:", Y)
```
===QUIZ===
Q: What is the main purpose of a trace table?
* To record variable values while dry-running an algorithm
- To store data in a database
- To draw a flowchart
> It helps find logic errors and the final output.

Q: `Count ← 0`, then a loop runs `Count ← Count + 2` four times. Final Count?
- 4
* 8
- 6
> 0 → 2 → 4 → 6 → 8

Q: In a WHILE loop, when is the condition checked?
* Before each iteration
- After each iteration
- Only once
> WHILE is pre-condition; it may run zero times.

---
title: "Standard algorithms: search, sort, total, count"
slug: ol-standard-algorithms
summary: "Paper 2 · Topic 7. Totalling, counting, max/min/average, linear search and bubble sort."
sort: 6
free: false
xp: 50
kind: lesson
minutes: 25
---
## The algorithms you must know 🧰

The syllabus expects you to understand and write these. Learn the patterns and Paper 2 gets much easier.

## Totalling & counting

```pseudocode
Total ← 0
Count ← 0
FOR Index ← 1 TO 10
    Total ← Total + Marks[Index]
    IF Marks[Index] >= 50
      THEN
        Count ← Count + 1
    ENDIF
NEXT Index
OUTPUT "Average: ", Total / 10
OUTPUT "Passed: ", Count
```

## Maximum, minimum, average

```python
marks = [67, 82, 45, 91, 73, 58]
highest = marks[0]
lowest = marks[0]
total = 0
for m in marks:
    if m > highest:
        highest = m
    if m < lowest:
        lowest = m
    total = total + m
print("Max:", highest, "Min:", lowest, "Avg:", round(total / len(marks), 1))
```

> 🎯 Set max/min to the **first value** (or a very low/high number), never to 0 for min!

## Linear search 🔎

Check each item one by one until you find it or reach the end.

```pseudocode
Found ← FALSE
Index ← 1
INPUT Target
WHILE Found = FALSE AND Index <= 10 DO
    IF Names[Index] = Target
      THEN
        Found ← TRUE
      ELSE
        Index ← Index + 1
    ENDIF
ENDWHILE
IF Found = TRUE
  THEN
    OUTPUT "Found at position ", Index
  ELSE
    OUTPUT "Not found"
ENDIF
```

## Bubble sort 🫧

Compare neighbours and swap if they're in the wrong order. After each pass, the biggest unsorted value "bubbles" to the end. Stop when a pass makes **no swaps**.

```python
nums = [29, 10, 14, 37, 13]
n = len(nums)
swapped = True
passes = 0
while swapped:
    swapped = False
    for i in range(n - 1 - passes):
        if nums[i] > nums[i + 1]:
            nums[i], nums[i + 1] = nums[i + 1], nums[i]   # swap
            swapped = True
    passes += 1
    print("After pass", passes, ":", nums)
```

```reveal
Why use a 'swapped' flag?
If a full pass makes **no swaps**, the list is already sorted, so the algorithm can stop early instead of doing pointless passes. This makes it more efficient.
```

## Swap needs a temp variable (in pseudocode)

```pseudocode
Temp ← List[Index]
List[Index] ← List[Index + 1]
List[Index + 1] ← Temp
```
===QUIZ===
Q: What should `Min` be initialised to when finding the minimum mark?
- 0
* The first mark in the list
- −1
> Starting at 0 would give the wrong answer, since no mark is lower than 0.

Q: A linear search…
* checks each item in turn until found or the end is reached
- needs the list to be sorted first
- splits the list in half each time
> Linear search works on unsorted lists, one item at a time.

Q: In bubble sort, when can the algorithm stop early?
- After the first pass
* When a pass makes no swaps
- When the first item is the smallest
> No swaps means everything is in order.

---
title: Databases & SQL
slug: ol-databases-sql
summary: "Paper 2 · Topic 9. Fields, records, primary keys, data types and SQL queries you can actually run."
sort: 7
free: false
xp: 45
kind: lesson
minutes: 20
---
## Single-table databases 🗃️

A **database** stores data in a **table**:

- **Field** = a column (one type of data, e.g. `Name`)
- **Record** = a row (all data about one item)
- **Primary key** = a field that's **unique** for every record (e.g. `StudentID`)

| StudentID | Name | Class | Score | Paid |
|---|---|---|---|---|
| S01 | Ayaan | 9 | 78 | TRUE |
| S02 | Nusaiba | 10 | 91 | TRUE |
| S03 | Rafi | 9 | 64 | FALSE |
| S04 | Zara | 10 | 85 | TRUE |

**Data types:** text/alphanumeric, character, Boolean, integer, real, date/time.

## SQL you need

| Keyword | Does |
|---|---|
| `SELECT` | which fields to show |
| `FROM` | which table |
| `WHERE` | condition to filter records |
| `ORDER BY` | sort (ASC or DESC) |
| `SUM` | add up a numeric field |
| `COUNT` | count matching records |

```
SELECT Name, Score
FROM Students
WHERE Class = 10 AND Score > 80
ORDER BY Score DESC;
```

## Run real SQL here 🐍

Python has a built-in database engine called SQLite. Edit the query at the bottom and press Run:

```python
import sqlite3
db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE Students (StudentID TEXT PRIMARY KEY, Name TEXT, Class INTEGER, Score INTEGER, Paid BOOLEAN)")
db.executemany("INSERT INTO Students VALUES (?,?,?,?,?)", [
    ("S01", "Ayaan", 9, 78, True), ("S02", "Nusaiba", 10, 91, True),
    ("S03", "Rafi", 9, 64, False), ("S04", "Zara", 10, 85, True),
])

query = """
SELECT Name, Score
FROM Students
WHERE Class = 10
ORDER BY Score DESC;
"""
for row in db.execute(query):
    print(row)
```

Try these too:

- `SELECT COUNT(*) FROM Students WHERE Paid = 0;`
- `SELECT SUM(Score) FROM Students WHERE Class = 9;`
- `SELECT Name FROM Students WHERE Score >= 70 ORDER BY Name;`

```reveal
What is the output of: SELECT Name FROM Students WHERE Score < 80 ORDER BY Name;
**Ayaan, Rafi** (78 and 64 are below 80, sorted alphabetically).
```

> 🎯 **Exam tip:** read exactly which fields the SELECT asks for. If it says `SELECT Name`, don't write the scores in your answer.
===QUIZ===
Q: Which field would make the best primary key?
- Name
- Class
* StudentID
> It's unique for every student; names and classes can repeat.

Q: Which SQL keyword filters records using a condition?
- ORDER BY
* WHERE
- SELECT
> WHERE keeps only records that match the condition.

Q: In a database table, a single row is called a…
- field
* record
- key
> A record is all the data about one item.
