
## Getting started

```bash
# clone the project
git clone https://github.com/vcall-holding/cms_dl_vcall_api.git

# install dependency
npm install 

# develop
npm run start
```

#### update Boss (Thêm BOSS mới tự động)
1. update data on src/constant/migrations.admins.js

#### migration (Khi khởi tạo dự án lần đầu chạy migration để thêm ROLE, PERMISSION mặc định)
- For migration
1. run migration
```bash
sh src/helper/database/migration_database.sh
```