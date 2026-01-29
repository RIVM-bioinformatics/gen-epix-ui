# Changelog

## [1.10.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.9.2...v1.10.0) (2026-01-29)


### Features

* add AfterIdentityProviderSelection and AfterLoginElement to config ([8084893](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/8084893d2db4497902d1769d1537b25176f207e9))
* add aria labels to reset buttons ([f0a40e2](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/f0a40e23fa63ebeea9f78e42a3179a757416b16e))
* add case type dim and refactor everywhere accordingly ([129fabc](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/129fabc60555defbfea29076a2a8d279aab173dc))
* add excel template download action to cases page ([4e373c0](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/4e373c0a8797a26c2561b02de5622144f905ccf9))
* allow all users to see their own api permissions ([cb0e786](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/cb0e78605d160e91298b795a910c30dcb910bdb0))
* allow user to dismiss the maximum results exceed message in the dashboard ([052db46](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/052db4690968e61a7ab56bd2a7500527fada9998))
* apply new uploading structure ([#69](https://github.com/RIVM-bioinformatics/gen-epix-ui/issues/69)) ([fa9724e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/fa9724e1bf18c73c1f257fe188c8a757863d52af))
* better upload error feedback ([#70](https://github.com/RIVM-bioinformatics/gen-epix-ui/issues/70)) ([6cf325c](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/6cf325c63071a3d25399c7e57778ec8451fede27))
* expand case type admin page with new attributes ([e093c76](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e093c768e218f80b97b8d3ce2a819d8af1143eed))
* implement completeCaseType.create_max_n_cases ([9f66ecf](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/9f66ecf709332ac412838df73f4b5da024bd067a))
* implement completeCaseType.delete_max_n_cases ([786447b](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/786447bc9121ebff38abec6dd4d61bae845c7dcf))
* implement completeCaseType.read_max_n_cases, add maximum results exceeded message ([ca9bf60](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ca9bf6006ac39047b05b436cfee05721d9b9b3f8))
* implement completeCaseType.read_max_tree_size ([0030705](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/00307053e6babf58034a6ba5f1c954897af99f9a))
* improve accessibility ([#66](https://github.com/RIVM-bioinformatics/gen-epix-ui/issues/66)) ([fb7f8c9](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/fb7f8c90b3f281c12f91bbcfb62f973d2cc26aa7))
* improve delete confirmation dialog ([4ec503d](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/4ec503d5db2db797e39ebd48bf0eb622ae86518b))
* improve delete confirmation for all crud pages ([aab2e2d](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/aab2e2d63416c1a51298ec5c76090fbda294432e))
* improve forms ([#65](https://github.com/RIVM-bioinformatics/gen-epix-ui/issues/65)) ([7e01c90](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/7e01c9063291ffa17d1f6599cac90e9525556d16))
* re-enable home page trends with optimized query ([18fdad1](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/18fdad16cfe38c3fd62e51e04954df426ec2af75))
* selectable rows in a table can be disabled - implement disabled state for upload validation when row has errors ([009bb1f](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/009bb1fcb17bd6ad20a23e7048fa666490e5da7f))
* update dependencies ([0729d0d](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/0729d0d4f981e43fdb5ea012c4ea133120012655))
* update to latest api - improve case stat performance ([daef8b4](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/daef8b4d5618f216dfd790edc0557e17e109aed7))
* update user menu styling and ordering ([3383520](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/3383520b2c26ac84002beafc6ff1a93155d4980a))
* use useQueryMemo instead of useQuery ([18fdad1](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/18fdad16cfe38c3fd62e51e04954df426ec2af75))
* user effective rights tester ([#71](https://github.com/RIVM-bioinformatics/gen-epix-ui/issues/71)) ([b2bcbcf](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/b2bcbcf3ee0e4317e7a46dc36e9ad488a20511e1))


### Bug Fixes

* add outage date formatting and filtering ([ee21447](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ee21447d7248278ee16bac3df354d4166286749d))
* column.isDisabled is not a function ([605c2bc](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/605c2bcac7b01d631439f24e6ed2a52d2d189ead))
* disable the home page trends ([1a698d3](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1a698d32047d199521db61e262e9284861df25da))
* fix aria-label vertical resize handle ([9af0ab6](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/9af0ab6ee1f4ed35b0a3a5eccc0b2b712e144333))
* fix CASE_IDS_BY_QUERY cache invalidation ([2b3b895](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/2b3b8959146bb7c2b10b59c5eaa88b71ac46913d))
* fix more forms ([c47ec3f](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/c47ec3f18a530093daab4e4772fc9846d5f9995d))
* fix runtime error caseSet.id in EpiDashboard ([1dc0372](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1dc0372f8966d87b274bf90c9ecba49a6b643b15))
* fix the select all checkbox so it takes disabled rows into condideration ([a6be018](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/a6be018a09e44556fd44532c013715223c5964e2))
* fix user feedback dialog form ([a85d87a](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/a85d87a3c874184ad61f67b738b11577fdf47f3f))
* hide save button and form when user has insufficient rights to create an event ([d3ecbb6](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/d3ecbb61e56ba8bc99c8cc6b14b32f870aa447c0))
* make selected sample column the first column in sequence mapping ([f9070d6](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/f9070d63115471074117e462aab53b91cdcf97cf))
* remove description column from table in admin pages ([e093c76](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e093c768e218f80b97b8d3ce2a819d8af1143eed))
* show cases even if max number of results has been exceeded ([220f9af](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/220f9af3cade1a7ec60e3d46e28a98c1991e89bc))
* swap n_cases with n_own_cases on events page ([9f18b6c](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/9f18b6cdc0027a4a13c728c22852e2d1d021acc8))
* the Maximum results exceeded message ([203bbf7](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/203bbf7740b9e2d62c676f2e69cb45093bbb999e))

## [1.9.2](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.9.1...v1.9.2) (2025-11-28)


### Bug Fixes

* make file_content in request body of type string instead of bytes ([676ed9d](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/676ed9dd998b6daf2e290acbec8cd93160ff9bbd))

## [1.9.1](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.9.0...v1.9.1) (2025-11-28)


### Bug Fixes

* use updateUser endpoint and fix role options in user edit form ([f46eb7d](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/f46eb7db98e97d92d57e6c6d475d9f4506189d01))

## [1.9.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.8.7...v1.9.0) (2025-11-28)


### Features

* disable all form fields if user is not allowed to edit item ([82ed9c3](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/82ed9c34d46f72f43e6eacbb9b941fc3009873c8))


### Bug Fixes

* fix Your organization’s admins text ([b7e9bee](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/b7e9beeea62a6305fd6853f0ea2f3591ab7bc172))
* remove DataCollectionVisualizationPage ([e995050](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e995050f435aec09abf0ae1ff9de3e9a544e0585))
* update immer to fix "Cannot assign to read only property" ([5fc1fa9](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/5fc1fa902f67838f79ff063dd8ca1c785d5067bb))
* use key instead of email property to populate email field for user invitations ([9d5a01d](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/9d5a01d9d439c8f3e81bab95a600611b0171a2e8))

## [1.8.7](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.8.6...v1.8.7) (2025-11-27)


### Bug Fixes

* fix dependency cycle ([0059da8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/0059da854052cfe1c4855ffae4073d6e6562cc9e))
* force typescript version ([4221781](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/4221781f9f64f5ad6b472f81494c10ab4357dc15))

## [1.8.6](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.8.5...v1.8.6) (2025-11-26)


### Bug Fixes

* set all peer dependencies as external in rollup build boptrions ([79e38a8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/79e38a8262a3195c7ad5e2e329d5f62b9f95627d))

## [1.8.5](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.8.4...v1.8.5) (2025-11-25)


### Bug Fixes

* move emotion cache to manager ([52742ec](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/52742ecde5c1ab7df7ede88d268875ee07a048d3))

## [1.8.4](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.8.3...v1.8.4) (2025-11-25)


### Bug Fixes

* fix style rendering ([4ba4419](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/4ba44194487e0404541f4d22e3a4044275547e14))

## [1.8.3](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.8.2...v1.8.3) (2025-11-25)


### Bug Fixes

* remove peer dependencies from dependencies ([1ad5ece](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1ad5eceb776ffcfe680bba1e94aab961af16ad72))

## [1.8.2](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.8.1...v1.8.2) (2025-11-25)


### Bug Fixes

* fix dependencies ([d7b5b57](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/d7b5b57c31db60adb03c0f43f5b720d062be9a55))
* list [@mui](https://github.com/mui) dependencies as peer dependencies ([0830e47](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/0830e47f4e8be56cae5e3e8092e56c6828b61b53))

## [1.8.1](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.8.0...v1.8.1) (2025-11-25)


### Bug Fixes

* fix peer depencencies ([74159a9](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/74159a9a9a9130a66e0b5b284cd7ae30811e4828))
* fix peer depencencies ([9443ef5](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/9443ef5451d689bd4d75b4f0e196074ecaffbfe4))

## [1.8.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.7.0...v1.8.0) (2025-11-25)


### Features

* pause inactivity notification when user is uploading ([d753002](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/d753002b2a081b01b1049af441d08d904d02625b))
* update all dependencies to latest ([a400f8e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/a400f8e2f8eec3468e37df53673e721c9310b765))


### Bug Fixes

* fix filter sidebar vor epi dashboard ([c2ad3da](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/c2ad3da13a304dead93afcc317ba21b688d32b5b))

## [1.7.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.6.0...v1.7.0) (2025-11-20)


### Features

* add 409 response code error message ([5c081a2](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/5c081a224ce1d37d02e2ea1ae5c04e043f046b0b))
* add concept sets admin page ([766d944](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/766d9449920b2956d2c793ee2b36ae6a638097c5))
* add concept- and region relation management pages ([e0b0dec](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e0b0dec63a8ed28d996811a4c6cfeee2e1911355))
* add dialog title to all crud create dialogs ([a18baed](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/a18baedec7013ec7ec6c6cc63f53e69e991142a5))
* add generic error handling to delete mutation ([e033694](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e03369499d90af75034b218b36b04abd42943381))
* add issue column in upload validation table and show issues in tooltip per cell ([cf91222](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/cf91222779e7d269ade24b351353db88bd8affd9))
* add privacy notice for RTE elements ([b21df3d](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/b21df3df0e5e40601ae91b71bb9be00790291e2c))
* add site- and contact management pages ([56e14c7](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/56e14c7816e4f9e80ba21d62481996368f52709a))
* at nonce support for emotion ([ef6aa6e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ef6aa6ea15821b6264a33d974be641b97c42561c))
* change navlink name ([af1d2fe](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/af1d2fefb461c866580b7b4dc8f17c78175ad4de))
* change navlink name ([b4310f5](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/b4310f5cad490aae5e5d49b3b493424807812af6))
* check for correct rights to upload ([9161830](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/9161830b0747cae3054b34c5fb8321d8aebc24eb))
* check identity providers availability before logging in and restyle login and logout pages ([952ddb5](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/952ddb5ec7ccbab6c8ec308b834595276441485c))
* checkbox to check/uncheck a sub-group of columns ([8b1b627](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/8b1b62744fedcd397d9af158a92545b0bf342f8f))
* create (more) user friendly message when backend is unavailable ([ab1abea](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ab1abea51b6132a1d5b76982d704070826536081))
* create upload sequences file mapping logic ([da71bd4](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/da71bd4f80018f324cdc3ce932e1f1c6bdeac5b5))
* download fasta using multi part form having token in request body ([79f6ca8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/79f6ca851f886fb8dacc2922c15b683d26ea6884))
* enhance rendering of issue cells (use strikethrough original value) ([6def59e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/6def59e73bd4680aabadd95160b4f32dd0cc1f45))
* hide columns in upload validation result if all values are derived ([5693f14](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/5693f1462a0665b515fc6b0d79c26e58952ec09e))
* if there is only one identity provider, use it automatically to log in ([1cfb3e3](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1cfb3e35514631674933eaca4780ee32372e528a))
* implement user invite constraints from backend ([61526e5](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/61526e55399f9cad4abe79fe6e77c0f367f23fa6))
* make regions and region-set-shapes a sub-page of region-sets ([3cdfabf](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/3cdfabf2214d8f83c89e539dfe008038d7838d70))
* move download menus to single download in the sidebar ([7f43f27](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/7f43f27d1a926732e6a77c2baa8b6511835f893b))
* refactor upload with store ([026bab6](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/026bab65ae53749534862697019ae52e90a02328))
* roles as strings ([e67963e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e67963ef1267f1c99cd7ab4fa1e2b99b0c6788e0))
* show columns from file instead of system during file upload mapping ([6a70155](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/6a7015525f1b3a67caee08ecbfb89a55c80ad7ea))
* show upload data preview in map columns step ([6014ffa](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/6014ffa8de2b610bbf8cd98180837cabf43fd157))
* update api ([dffc1b7](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/dffc1b7cd39ba856dff7fd7ff11104baffa5ad95))
* update api - fix upload ([e52dede](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e52dede68b332392c221f2bd6faa65bde309d117))
* update initial visible columns in line list ([f865f01](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/f865f015c4e11aeb8594835cb6e042bae80ccd7c))
* update to latest API ([5dc2dcd](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/5dc2dcd0fe26f72a0afb71b78973743f24e16a6f))
* upload (part 1) ([ed21465](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ed214659c3bea683c9a11ac0db6b729b37970bb9))
* upload (work in progress) ([fbee738](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/fbee738fc15f13448c5fd0b8fbee46e0f2de589a))
* upload (work in progress) ([06a70bd](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/06a70bd1d2007bf0697028e3e64dd9e69d0a91b7))
* upload sequences ([85dfa94](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/85dfa9454b9c01b772fa7236d0b16e2078e6a81e))
* upload sequences ([e97a987](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e97a98725bc6f2060f034f8bbf34834a702f2cf6))
* use new 'invite_user' endpoint ([8bb154e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/8bb154ec5660ba0a43c0daf790ef43b292f6dcc5))
* use write-excel-file in favour of exceljs ([b01c7ce](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/b01c7ce198ae7f9db1c0e139bef7e1beec5f2749))


### Bug Fixes

* add CreateCasesCommand to required permission for upload ([ff646c4](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ff646c4e39f710417d7267c0ce644095fea1251e))
* add nonce support for react-resizable-panels ([63012e8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/63012e8a4ac655af8f59709f3d3a10ac6f059d95))
* add nullish coalescing in upload select file ([8813fdf](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/8813fdf2217bd2a860212549b86f23c466f74008))
* allow downloading tree canvas even when unlinked ([cf804e0](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/cf804e0f71d8f136c56ed8b6d27ddd9169923fae))
* don't allow a string of empty space characters during validation of forms ([fd9c3a2](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/fd9c3a27f714190a3ba5a911d380b3954ebd4964))
* don't set censor if value is undefined ([6237b19](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/6237b19545ff8211c893e5297d26ee4e932438c5))
* filter mapped columns during column mapping ([9b89d0e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/9b89d0e906114525e237b64e7cc58eab27ff3040))
* fix 404 error notification message ([7f3f5c7](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/7f3f5c753a7e81381e50d030ef1147a2a19c2739))
* fix basurl for fasta download ([a68ffac](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/a68ffacc060b23217e32cbf424b9ee4a554b31c0))
* fix column dragging in tables ([ced5099](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ced5099d770cd9955587ea58f1792593ec12936f))
* fix date range picker now that MUI has fixed their date-picker bugs ([cdece6b](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/cdece6bd8a87f90df8fb9815618141b32a2043db))
* fix error handling in home page trends ([22f4964](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/22f4964e83376e82bac9cc8dece407c2a5a9291d))
* fix inactivity timeout causing chrome to crash ([ce2d833](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ce2d83334fdad544f6a42caef96edc10e8170b79))
* fix incidence map download labels ([6f4ebae](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/6f4ebae9ae6007e84cb339de641b941257b368c5))
* fix logout behavior in generic error message ([cda73f8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/cda73f8fffa6996e3b25201e35083ff14c1f62c3))
* fix number columns ([c17a003](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/c17a003586a8ed04b0ac784753728d4db24ed63d))
* fix organization name in user account menu ([63f2bf1](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/63f2bf1e0a7a13fd2b13e6a503ab7a3d28962ed0))
* fix possible race condition in editMutation, deleteMutation and createMutation ([5fdaf1a](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/5fdaf1ac366cd726b46b1e6b1776f8ca188b9031))
* fix select sequence files form condition ([2c5b2fa](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/2c5b2fab9da9f2bf9ef0b55991a364fce288fde0))
* fix setting case_id column to undefined in upload column mapping ([76b7f04](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/76b7f04698604a32a1ed9f17b302e9a4c7b0c5c0))
* fix shareInDataCollectionIds in upload ([013fb19](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/013fb1983f648fefd37beeb549c5c69d170aee2d))
* fix state when optimistic update fails ([0036388](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/0036388e441b135d6a84f95b4168deb4f37bb171))
* fix table store initializer that was preventing a refresh of table data when the number of rows fall below 1 ([bcd504f](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/bcd504f77cbdb0fccccb3a11357e3f64e8397ff0))
* fix tree for empty branch length(s) ([5e995a6](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/5e995a6d32df60f8d0f1540deceea17a37ef792c))
* fix tree rending after updating case set ([5172ff6](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/5172ff6b905b914586ceb9a9eac37752a852a7c9))
* fix unable to map columns that were not previously mapped ([ffad138](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ffad138f4f83cf248d03e5ef2b6c60eca32e0e48))
* fix zIndex of sticky header in mapping ([6def59e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/6def59e73bd4680aabadd95160b4f32dd0cc1f45))
* hide actions menu item if there are no actions in table cell ([5122eae](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/5122eae56abebc082de232afcb24a21f8ba29f09))
* hide users own organization if user does not have access to retrieve organizations ([0839a98](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/0839a98ad6945961f0fc7302b853cef578a21405))
* invalidate cases after upload ([78f5b91](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/78f5b91ab6cf9eda2807b0c89abf0861d76491bf))
* prevent table from initializing when the rows are not set (but allow rows with 0 length) ([8ddad36](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/8ddad362fbefed7fdb754805f417b2419570328f))
* remember tree configuration from store ([eae31af](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/eae31af0df08f18c521450de93771e4d4adc1838))
* remove cell title from mapping cells ([6def59e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/6def59e73bd4680aabadd95160b4f32dd0cc1f45))
* remove invite user constraints query from users admin page ([569b3fd](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/569b3fd1bd17f58e7f78ab669b2b1cb40c9bf946))
* remove Outlet key to force a re-render ([4a8f231](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/4a8f231a6caa550c359be877dce5cffe582b72d8))
* render phylogenetic tree leaf nodes last, so they are on top of the connecting lines ([ecad644](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ecad644e6c43c3ea72a834fc6faecbcf9821f092))
* show tree is unavailable when tree is NULL ([ef0d935](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ef0d935b5c0a46ff5c53e37f5b1a3b9109133f85))
* show unmapped columns during column mapping ([bfdf64c](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/bfdf64c7675001ff3d1c2e9fd127050b6bbc8a24))
* skip parsing of newick when invalid newick is provided ([e77d981](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e77d98162f14a0805e833b70344961ff1db737d3))

## [1.6.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.5.2...v1.6.0) (2025-08-21)


### Features

* use backend licence endpoint ([bf96b33](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/bf96b33f79ef40a8cb8d9a6077143bb4a7e22a35))

## [1.5.2](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.5.1...v1.5.2) (2025-08-20)


### Bug Fixes

* downgrade @tanstack/react-query to 5.85.0 due to a known bug ([7433fe2](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/7433fe2c4b18ae140ac8136aeb0a8cac357f20b7))

## [1.5.1](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.5.0...v1.5.1) (2025-08-20)


### Bug Fixes

* update dependencies ([7e33811](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/7e33811a1c09874269443a4e67336dca80735e90))
* update dependencies ([689c571](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/689c571f1986bc905bcc4915d1cce378cf143a9c))
* update peer dependencies ([8f0d1f0](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/8f0d1f0d10f6b91aba102c5f5c19aa818d88e942))

## [1.5.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.4.0...v1.5.0) (2025-08-20)


### Features

* update to latest API ([a0467d8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/a0467d82fd8ad5c4c026f7937f973ee2fbd6aa84))


### Bug Fixes

* fix route permission for cases ([f0fc5d8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/f0fc5d8e01f49823e2a4fbee0752e7504b768ed9))
* wrap retrieveOrganizationAdminNameEmails in an RBAC wrapper ([c675218](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/c6752182ed79d5887ea517e9fbf8e67ef62036ec))

## [1.4.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.3.0...v1.4.0) (2025-08-14)


### Features

* add advances sorting algorithm to user:name and organization:name ([1beeb00](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1beeb00a8d3dd3efa8c61e473719d4196242563c))
* change copy permalink to clipboard icon, add permalink to case type dialog ([3a41a6b](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/3a41a6b54cd1eca91dae726d2d66de715bec97aa))
* column order menu ([f10c8dd](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/f10c8dd19f207fc88d4e8de7ceb655a02faadb38))
* effective user rights ([d53bb4c](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/d53bb4ca1cd1d12789e4c0c128f707d4611d2e77))
* make advanced sorting part of TableUtil ([4a86897](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/4a86897be0d73a397b83dbcd57709182850f426a))
* make edit- and create notification messages more descriptive bases on https status code ([9583ab7](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/9583ab7bc2aa4d89e98d333166225c72267c58da))
* on CrudPages you should always be able to open an item. ([b637e96](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/b637e96eef31fe85d3ab8b2597ead63a9e6146c9))
* remove sheejs dependency in favour of exceljs ([bae188d](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/bae188d8bbbb5471e710493d743cbd237183c9f7))
* rename context providers ([f10c8dd](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/f10c8dd19f207fc88d4e8de7ceb655a02faadb38))
* replace markdown editor with html editor ([c281ea7](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/c281ea7ce301d54f3c4d95e81af07fa36fe1c0fe))
* update api ([d84d3f9](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/d84d3f9db94430d4d049ec3de1c69caeaa2f2c57))


### Bug Fixes

* add baseBranches for renovate ([2cfbf8e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/2cfbf8eb331a3aa9e1b72398110ce5a81833d681))
* add correct config renovate ([2091a94](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/2091a94b4b4c83b20ad11cf631a5c087d22a59ac))
* allow organization name and organization legal entity code to contain an extended character set ([d144b8e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/d144b8e667c7c737edd6e82861d0888fd9e496c6))
* disable organization link if organization data is missing ([02df1ab](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/02df1ab98054b4ff8459734bbdf81a30db72abe7))
* downgrade typescript to 5.8.3 because 5.9.x does not work with eslint parser ([bae188d](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/bae188d8bbbb5471e710493d743cbd237183c9f7))
* epi list should show stratifying when stratifying on organization ([c28d5b6](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/c28d5b62de96412205220b6b72a98dd2840ed02c))
* fix data collection sets admin page should call the correct endpoint ([67ac9bb](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/67ac9bb5822fea1deffb889b6f6cdfb4ddcad126))
* fix StringUtil:advancedSortComperator so it doesn't fail on null and undefined values ([86d1422](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/86d142226270c99427dd146cc4e4bd2a78877650))
* fix table filter z-index so it appears on top of static table columns ([12405cd](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/12405cd0079d15f7fea6af1213665fe13c3eb9c5))
* fix tree rendering issues, show genetic distance from right to left (right being 0 distance) ([d97db0b](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/d97db0b5316dc7f205cb91908e28d47de8eb31c3))
* fix user's name and organization not set after editing ([197a388](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/197a3888b1b28e7ba604cbcbbb4a193f8f83d948))
* frontend should not fail when backend returns a 500 error for case type stats ([aff5a0e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/aff5a0e42d7bc1029ef34530ec43fb505ec81d90))
* hide home page trends if user does not have permission to see them ([cbe8544](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/cbe85441c8b20419e231b98aadd6f7b97a3a3e7c))
* make cancel buttons more consistent by removing them. in case- and caseset dialog changed to 'go back' button ([b593783](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/b5937833a9258ead05daf8d50b12fa90b9d8d317))
* number range filter upper_bound_censor when lower value and upper value are equal ([9ff8de5](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/9ff8de5fdc78ea039279d1ab1e45c5fbe9c9b7ca))
* populate organization field in UserInvitationsAdminPage for root and app_admin (temporary solution) ([2fa5d67](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/2fa5d67801ef4cb01d488be610a25eedaeeed877))
* users should not be able to edit themselves ([4cf35d8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/4cf35d8e5dd226e620d4fab40e5ed687104063cf))

## [1.3.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.2.0...v1.3.0) (2025-06-27)


### Features

* allow ApplicationFooterLink to receive box props ([90c0545](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/90c0545f5685d3fcc0923fb0de67927bb0e9a3bf))
* allow clicking and hovering tree lines in the tree ([16a881d](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/16a881d03ec680dadd70dc6591ebfb34cb92bd11))
* Download cases is in sort order of the screen ([1ff0cc8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1ff0cc82ece56ffa39405dc70e8315a736491560))
* Download line list should include case.id, case.case_type and case.case_date ([1ff0cc8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1ff0cc82ece56ffa39405dc70e8315a736491560))
* Download line list should only include visible rows ([1ff0cc8](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1ff0cc82ece56ffa39405dc70e8315a736491560))
* select event drop down shows created date ([473a5bb](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/473a5bb44f555ee4ba6c2ac847b5ae3609a31b8b))
* tree panning and zooming in ([117feca](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/117feca7703beb4f61922d3623f4dd9d0eb053f8))
* tree should snap to line list when subtree filter changes ([a47e582](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/a47e582c41346f5ca6469714119d0db40be6111e))


### Bug Fixes

* add more date picker fixes ([159b449](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/159b449c980786f5b60ab9afba84a53a3c6c7e0a))
* Created in data collection drop down is greyed out when there is only 1 choice ([e0778c6](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e0778c65ed9ef16d22d58351580d53efcf7b6792))
* fix date format of last_case_month in cases page ([1767976](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1767976c4afd114b40cff7de832fec3a8473e3d5))
* fix date range picker ([ef530ad](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/ef530ad85657fc24537ea4dbddf68091ac66e771))
* re-render table when filters / sorting does not change results ([3e14442](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/3e144427f30366b82f0f33761303803f216e2b46))
* show ripple effect in dialog, transferlist  and netsted dropdown for stratification ([b7209d9](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/b7209d92cc528edc4c492a37e2e0ef34f1872743))
* use isLoading instead of isPending ([4f0efd5](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/4f0efd50742342ed7492f7a48d3ef8f30a159aae))

## [1.2.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.1.0...v1.2.0) (2025-06-10)


### Features

* Make created in data collection more clear ([dc1ff4e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/dc1ff4e1c0dc0555955165e1ae979689d45d724a))


### Bug Fixes

* Allow editMutation to receive an getIntermediateItem. This fixes "Editing event produces error" ([1846bfc](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1846bfc4bbb610e2e68a244d35874d77da09651b))
* deleting an event should not throw an error ([830b5b6](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/830b5b61bd839af6f8eafcfa12ef284716f778f9))
* fix table header header overflow after resizing column ([d3420c7](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/d3420c7af4b471af5046259860e7e51fcc40eb6e))
* make year numbering correct for week of year format ([e764784](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/e764784cea05600b7f2499fc31f22dfdde6d170f))
* take is_full_access into account for deleting/sharing/editing case(sets) ([4266b97](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/4266b973b150dc715b69f5f8a350165d1af39b4e))

## [1.1.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.0.4...v1.1.0) (2025-06-05)


### Features

* update dependencies and add @emotion/* as peer dependency ([85610de](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/85610de45d33197acd3195e05740db2cd46f55df))


### Bug Fixes

* fix hosting problem in route components ([eb80ce0](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/eb80ce0322e34895b038133eaad067f6563cec03))

## [1.0.4](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.0.3...v1.0.4) (2025-06-04)


### Miscellaneous Chores

* release 1.0.4 ([45fe990](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/45fe990b53e2a59ba37d3ef6e2944b947eb0544d))

## [1.0.3](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.0.2...v1.0.3) (2025-06-04)


### Miscellaneous Chores

* release 1.0.3 ([6679ea9](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/6679ea9d633c13b6098b44819644625cf3e07feb))

## [1.0.2](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.0.1...v1.0.2) (2025-06-04)


### Miscellaneous Chores

* release 1.0.2 ([895384c](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/895384c83329d98456e6828251d79d4845b50928))

## [1.0.1](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v1.0.0...v1.0.1) (2025-06-04)


### Miscellaneous Chores

* release 1.0.1 ([729c69f](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/729c69fcc0ff0d9e5e02c807151d8a77216fe907))

## [1.0.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/v0.0.5...v1.0.0) (2025-06-04)


### Miscellaneous Chores

* release 1.0.0 ([042b592](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/042b5927992eb28c1c01d445b3ffd809b5cdd8ea))

## [1.0.1](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/gen-epix-ui-v1.0.0...gen-epix-ui-v1.0.1) (2025-06-04)


### Miscellaneous Chores

* release 1.0.1 ([1ca9717](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/1ca9717720093bd2c040e7014604d4f5b65eb1af))

## [1.0.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/gen-epix-ui-v1.0.0...gen-epix-ui-v1.0.0) (2025-06-04)


### Miscellaneous Chores

* release 1.0.0 ([af3bf86](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/af3bf86e756a5da4f316aeff36881951679a0dbc))

## [1.0.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/gen-epix-ui-v0.0.5...gen-epix-ui-v1.0.0) (2025-06-04)


### Miscellaneous Chores

* release 1.0.0 ([fcf999e](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/fcf999ee7449a2e06569488d4eeed949e7266181))

## [1.0.0](https://github.com/RIVM-bioinformatics/gen-epix-ui/compare/gen-epix-ui-v0.0.5...gen-epix-ui-v1.0.0) (2025-06-04)


### Miscellaneous Chores

* release 1.0.0 ([47cce75](https://github.com/RIVM-bioinformatics/gen-epix-ui/commit/47cce7512e27b2c817cd314bf7b8fdace1678879))
