<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TARGETscript.com</title>
    <script defer src="ErrorHandler/ErrorHandler.js"></script>
    <script defer src="Tokenizer/Tokenizer.js"></script>
    <script defer src="Parser/Parser.js"></script>
    <script defer src="Generator/Environment.js"></script>
    <script defer src="Generator/Generator.js"></script>
    <script defer src="Terminal/Terminal.js"></script>
</head>

<style>
    html {
        height: 100%;
    }

    body {
        color: black;
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100%;
    }

    #wrap {
        padding: 5px;
        margin: 0;
        position: absolute;
        top: 50px;
        bottom: 25%;
        left: 0;
        right: 0;
        background: rgba(203, 229, 130, 0.336);
    }

    #code {
        color: black;
        background: inherit;
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        border: none;
        outline: none;
        resize: none;
        float: right;
    }

    #output {
        position: absolute;
        top: 75%;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 8px;
        display: block;
    }

    #top {
        display: flex;
        white-space: nowrap;
        align-items: center;
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        height: 50px;
        background-color: #252723;
    }

    .top-btn {
        margin-top: 10px;
        margin-bottom: 10px;
        margin-right: 5px;
        border-radius: 5px;
        box-sizing: border-box;
        height: 30px;
        height: 30px;
        border: 1px solid green;
        font-size: 16px;
        font-family: sans-serif;
        background: green;
        color: white;
        position: static;
        top: 1px;
        border-radius: 5px;
        -webkit-appearance: none;
    }

    #tgs {
        padding-left: 10px;
        padding-right: 20px;
        padding-top: 5px;
        font-size: 20px;
        font-family: sans-serif;
        background-image: linear-gradient(to left, violet, indigo, blue, green, yellow, orange, red);   -webkit-background-clip: text;
        color: transparent;
        font-weight: 900;
    }
</style>

<body>
    <div id="top">
        <div id="tgs">
            TARGET SCRIPT LANGUAGE PLAYGROUND
        </div>
        <!-- La tokenizer il puteti pune intr-un <pre> daca vreti pt ca "sa-i spuneti" html-ului ca e deja formatat -->
        <input type="button" value="Tokenize" id="tokenize" class="top-btn" onclick="Tokenize(document.querySelector('textarea').value)">
        <input type="button" value="Parse" id="parse" class="top-btn" onclick="Parse(document.querySelector('textarea').value)">
        <input type="button" value="Run" id="run" class="top-btn" onclick="compile(document.querySelector('textarea').value)">
    </div>
    <div id="wrap">
        <textarea id="code" wrap="off" style="width: 97%;"></textarea>
    </div>
    <pre id="output">

    </pre>
</body>
</html>