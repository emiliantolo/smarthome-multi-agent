:: comment process.stdout.clearLine(0); and process.stdout.cursorTo(0); in Clock.js
:: uncomment process.exit(); in scenario.js
for %%a in (src/scenarios/scenario*.js) do node src/scenarios/%%a > logs/%%~na_full.log 2>&1 
