# Vietnam administrative address data

`vietnam-administrative-units.json` is a normalized snapshot of the
`all-province.json` and `all-ward.json` datasets from
[open-admin-data/vietnam-administrative-divisions](https://github.com/open-admin-data/vietnam-administrative-divisions),
released under the Creative Commons Attribution 4.0 International (CC BY 4.0)
license. The upstream dataset reports its latest update as 2026-09-08.

The normalized file keeps the 34 province-level units and 3,321 commune-level
units, with each ward/commune linked to its province. Names and codes come from
the upstream data; the JSON shape was changed for the checkout form.
