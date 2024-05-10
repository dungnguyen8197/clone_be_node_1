const { v4 } = require("uuid");
const fs = require("fs");
const { ThrowReturn } = require("../router/extensions");
const path = require("path");

const check_special_characters_in_file_name = (filename) => {
    for (let i = 0; i < filename.length; i++) {
        if (filename.charAt(i) === "%" || filename.charAt(i) === "#") {
            return true;
        }
    }
    return false;
};

const convert_name_file = (file) => {
    let filename;
    let is_spacial_characters;
    try {
        filename = decodeURIComponent(escape(file.name));
        is_spacial_characters = check_special_characters_in_file_name(filename);
    } catch (e) {
        filename = file.name;
        is_spacial_characters = check_special_characters_in_file_name(filename);
    }
    //chứa ký tự đặc biệt return 0
    if (is_spacial_characters) return 0;
    const tail_file = ["jpeg", "jpg", "png", "xlsx", "doc", "docx", "pdf"];
    if (tail_file.includes(filename.split(".").reverse()[0])) {
        return v4() + "__" + filename;
    }
    //Định dạng đuôi không mong muốn
    return 1;
};

const save_file = async (path, data) => {
    await fs.writeFile(path, data, function(err) {
        if (err) {
            throw new ThrowReturn("uploads fail");
        }
    });
};

module.exports.upload_file = async (files_upload, save_to_folder) => {
    let file_name = convert_name_file(files_upload);
    if(file_name===0) return 0
    if(file_name===1) return 1
    if (
        !fs.existsSync(path.join(__dirname, `../../public/${save_to_folder}`))
    ) {
        fs.mkdirSync(path.join(__dirname, `../../public/${save_to_folder}`), { recursive: true });
    }
    await save_file(`public/${save_to_folder}/${file_name}`, files_upload.data);
    return { url: `/${save_to_folder}/${file_name}` };
};
