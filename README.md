# NGPC'26 upload-ready site

This folder is the clean version to connect to Cloudflare Pages. It contains no delegate roster or chair login keys.

## Before publishing

1. Get the school's approval before adding student records to a cloud service.
2. Create a Cloudflare D1 database and run `schema.sql` in its SQL Console.
3. In the Cloudflare Pages project, add a D1 binding named `DB` and select that database. Redeploy after adding the binding.
4. Import approved delegate records into D1. Do not upload a roster file into this folder or the public GitHub repository.

The endpoint `/api/delegate` returns one record matching the submitted name. Name-only lookup is not identity verification; anyone can try known or guessed names. Use a school-approved access code if delegates must only see their own details.

The saved delegate details use `sessionStorage`, so they are kept only for the current browser tab session. The original roster and one-time D1 import file are kept separately in `../../work/ngpc2026-private-data/` for data preparation; do not upload or commit that folder. The import file contains all 119 records currently present in the original `delegates.js`.

The legacy chair portal is hidden in this public copy because its keys were stored in browser JavaScript in the original version. The original source remains unchanged outside this clean upload folder.
