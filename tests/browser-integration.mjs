/** Full browser verification entry point. Both suites exercise the actual local app. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const output='qa/improvements-20260918';
fs.mkdirSync(output,{recursive:true});
const suites=['interaction-regression.mjs','inspection-regression.mjs'];
for(const suite of suites){
  const result=spawnSync(process.execPath,[path.join('tests',suite)],{stdio:'inherit',cwd:root});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}
const interaction=JSON.parse(fs.readFileSync(`${output}/interaction-results.json`,'utf8'));
const inspection=JSON.parse(fs.readFileSync(`${output}/inspection-results.json`,'utf8'));
const summary={testedAt:new Date().toISOString(),baseURL:'http://127.0.0.1:5175',browser:'Installed Google Chrome / Playwright',touchMethod:interaction.touchMethod,results:[...interaction.results,...inspection.results],errors:[...interaction.errors,...inspection.errors]};
fs.writeFileSync(`${output}/browser-results.json`,JSON.stringify(summary,null,2));
console.log(`\nCompleted ${summary.results.length} browser check groups. Errors: ${summary.errors.length}. Evidence: ${output}/browser-results.json`);
