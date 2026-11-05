"""
Sample reading material and pre-compiled demonstration data for Python Functions.
"""

SAMPLE_READING_MATERIAL = """# Python Functions: Arguments, Return Values, and Scope

Functions are fundamental building blocks in Python that organize code into reusable, modular blocks.

## 1. Defining Functions and Arguments
A function is defined using the `def` keyword, followed by the function name and parentheses containing parameters.

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"
```

- **Parameters vs Arguments**: *Parameters* are the variable names listed in the function definition. *Arguments* are the actual values passed to the function when calling it.
- **Positional Arguments**: Must be passed in the exact order in which they are defined.
- **Default Arguments**: Provide a fallback value if no argument is passed during the function call. In Python, parameters with default values must always follow parameters without default values.

## 2. Return Values
Functions use the `return` statement to send a value back to the caller.
- If a function does not have an explicit `return` statement or executes a bare `return`, it implicitly returns `None`.
- A function terminates immediately when a `return` statement is executed; any code following it in that block is unreachable.
- Python functions can return multiple values separated by commas, which Python packs into a single tuple.

```python
def get_user_stats(scores):
    total = sum(scores)
    average = total / len(scores)
    return total, average  # returns a tuple: (total, average)
```

## 3. Variable Scope: Local vs Global
Variable scope determines where in a program a variable can be accessed or modified.

- **Local Scope**: Variables defined inside a function belong to the local scope of that function. They are created when the function is called and destroyed when the function finishes execution. Local variables cannot be accessed from outside the function.
- **Global Scope**: Variables defined at the top level of a module or file belong to the global scope. They can be read from inside any function.
- **Modifying Global Variables**: To modify a global variable inside a local function scope, Python requires the `global` keyword. Without `global`, assigning to a variable inside a function creates a new local variable shadowing the global one.

```python
counter = 10  # global variable

def increment():
    global counter
    counter += 1

def reset():
    counter = 0  # creates a local variable 'counter', does not modify global counter
```
"""

SAMPLE_QUESTIONS = [
    {
        "id": 1,
        "type": "theory_mcq",
        "type_label": "Theory MCQ 1",
        "prompt": "According to the reading material, what is the syntactic rule for parameters with default values in Python?",
        "code_snippet": "",
        "options": [
            {"key": "A", "text": "They must always appear before parameters without default values.", "is_correct": False},
            {"key": "B", "text": "They must always follow parameters without default values.", "is_correct": True},
            {"key": "C", "text": "They can be placed in any arbitrary position in the parameter list.", "is_correct": False},
            {"key": "D", "text": "They can only be used if the function returns multiple values.", "is_correct": False}
        ],
        "correct_answer": "B",
        "explanation": "In Python function definitions, parameters with default values must always follow parameters without default values.",
        "source_chunk": "## 1. Defining Functions and Arguments",
        "source_quote": "In Python, parameters with default values must always follow parameters without default values.",
        "is_approved": False
    },
    {
        "id": 2,
        "type": "theory_mcq",
        "type_label": "Theory MCQ 2",
        "prompt": "What happens if a variable is assigned a value inside a function without declaring it as 'global'?",
        "code_snippet": "",
        "options": [
            {"key": "A", "text": "It automatically overwrites the global variable of the same name.", "is_correct": False},
            {"key": "B", "text": "It raises a syntax error at compilation time.", "is_correct": False},
            {"key": "C", "text": "It creates a new local variable shadowing the global one.", "is_correct": True},
            {"key": "D", "text": "It converts the variable into a tuple return type.", "is_correct": False}
        ],
        "correct_answer": "C",
        "explanation": "Without the 'global' keyword, assigning to a variable inside a function creates a new local variable shadowing the global one rather than modifying the global variable.",
        "source_chunk": "## 3. Variable Scope: Local vs Global",
        "source_quote": "Without 'global', assigning to a variable inside a function creates a new local variable shadowing the global one.",
        "is_approved": False
    },
    {
        "id": 3,
        "type": "true_false",
        "type_label": "True / False 1",
        "prompt": "If a Python function does not include an explicit return statement, it implicitly returns None.",
        "code_snippet": "",
        "options": [
            {"key": "True", "text": "True", "is_correct": True},
            {"key": "False", "text": "False", "is_correct": False}
        ],
        "correct_answer": "True",
        "explanation": "As stated in the text, if a function does not have an explicit return statement or executes a bare return, it implicitly returns None.",
        "source_chunk": "## 2. Return Values",
        "source_quote": "If a function does not have an explicit return statement or executes a bare return, it implicitly returns None.",
        "is_approved": False
    },
    {
        "id": 4,
        "type": "true_false",
        "type_label": "True / False 2",
        "prompt": "Variables defined inside a function's local scope can be directly accessed from the global scope after the function finishes execution.",
        "code_snippet": "",
        "options": [
            {"key": "True", "text": "True", "is_correct": False},
            {"key": "False", "text": "False", "is_correct": True}
        ],
        "correct_answer": "False",
        "explanation": "Local variables are destroyed when the function finishes execution and cannot be accessed from outside the function.",
        "source_chunk": "## 3. Variable Scope: Local vs Global",
        "source_quote": "Local variables cannot be accessed from outside the function.",
        "is_approved": False
    },
    {
        "id": 5,
        "type": "code_analysis",
        "type_label": "Code Analysis",
        "prompt": "What will be printed when the following code from the reading material is executed?",
        "code_snippet": "counter = 10\n\ndef reset():\n    counter = 0\n\nreset()\nprint(counter)",
        "options": [
            {"key": "A", "text": "0", "is_correct": False},
            {"key": "B", "text": "10", "is_correct": True},
            {"key": "C", "text": "None", "is_correct": False},
            {"key": "D", "text": "UnboundLocalError", "is_correct": False}
        ],
        "correct_answer": "B",
        "explanation": "Inside reset(), assigning counter = 0 creates a local variable named counter. It does not modify the global counter variable. Therefore, print(counter) outputs 10.",
        "source_chunk": "## 3. Variable Scope: Local vs Global",
        "source_quote": "counter = 0  # creates a local variable 'counter', does not modify global counter",
        "is_approved": False
    }
]
