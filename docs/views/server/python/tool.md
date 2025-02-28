# 工具的使用


## 包管理器

pip命令

```cmd
// 安装
pip install package_name
pip install package_name==version_number
pip install -r requirements.txt
// 升级包
pip install --upgrade package_name
// 卸载包
pip uninstall package_name
// 列出所有包
pip list
pip list > requirements.txt
//  查看包详情
pip show package_name
// 搜索包
pip search search_term
// 生成项目依赖文件
pip freeze > requirements.txt
```

conda 命令

```cmd
// 创建conda 环境指定python版本
conda create -n myenv python=3.9
// 激活conda 环境
conda activate myenv
// 查看所有环境
conda env list
// 停用环境
conda deactivate
// 删除环境
conda remove -n myenv --all
// 在激活的环境安装包
conda install numpy
conda update numpy
conda remove numpy
conda list
# 导出到YAML文件（推荐）
conda env export > environment.yml
# 根据YAML文件创建新环境
conda env create -f environment.yml
```