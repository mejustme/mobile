module.exports = function(grunt) {
    require('time-grunt')(grunt);    //Grunt处理任务进度条提示
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        // 声明路径变量
        build_root: 'build',
        css_root: 'build/css',
        less_root: 'less',

        //任务less:中子任务compile(自定义),把less文件预编译成css
        less:{ // 主任务名称必须是插件名后面部分(一般，是插件作者自定义的)
            compile:{
                //options 子任务配置参数，覆盖默认参数值
                options:{
                    compress: true
                },
                expand: true,  //开启下面参数
                cwd: '<%= less_root %>', //当前路径
                src: ['page/*.less','common.less'],
                dest: '<%= css_root %>/',
                ext: '.min.css'
            }
        },
        //任务uglify:中子任务compile,把js文件简化压缩(先browserify合并模块js 再 压缩成min.js)
        uglify: {
            compile:{
                expand: true,
                cwd: '<%= build_root %>/js',
                src: ['**/*.js','**/**/*.js','!**/*min.js'],
                dest: '<%= build_root %>/js',
                ext: '.min.js'
            }

        },
        //任务copy:中有2个子任务compile和compilejson,移动文件
        copy:{
            compile:{
                expand: true,
                cwd: 'demos',
                src: ['**/*.html', '!_*.html'],
                dest: '<%= build_root %>/demos',
                ext: '.html'
            },
            compilejson:{
                expand: true,
                cwd: 'js/json',
                src: ['**/*.json'],
                dest: '<%= build_root %>/js/json',
                ext: '.json'
            }
        },
        // 任务browserify：模块化依赖加载合并成一个js文件方便浏览器端运行，服务器端模块化nodeJs是分开，也可以执行的。
        browserify:{
            compile:{
                expand: true,
                cwd: 'js',
                src: ['page/*.js','mod/*.js'],  // 仅要梳理依赖关系合并成一个的文件，（依赖的模块不用，会根据其中相对路径去找到依赖模块）
                dest: '<%= build_root %>/js',
                ext: '.js'
            }
        },

        // 当输入 grunt watch 那么就开启watch任务中所有子任务如css、html等
        // 当输入 grunt watch：html 那么就开启 watch任务中的html子任务
        watch:{
            //options,有s!
            options:{
                //开启 livereload 页面实时刷新
                livereload: true
            },
            css:{
                files: ['<%= less_root %>/**/*.less'],
                tasks: ['less:compile']
            },

            html:{
                files: ['demos/**/*.html'],
                tasks: ['newer:copy']
            },
            js:{
                files: ['js/page/**/*.js','js/mod/*.js'],
                tasks: ['browserify:compile']
            }

        },
        //webpage任务：脚手架产生模板文件
        webpage:{
            option:{
                js: 'js/page/',
                less: 'less/page/',
                demo: 'demos/',
                demoShowPath: 'http://localhost/study/angularjs-homework/build/demos/',
                tplPath: '.tpl'
            }
        }

    });

    //输出进度日志
    grunt.event.on('watch', function(action, filepath, target) {
        grunt.log.writeln(target + ': ' + '文件: ' + filepath + ' 变动状态: ' + action);
    });

    //加载插件模块，这些插件模块，也可能依赖其他插件模块，会自动到自己包中node_modules找，再到父的node_modules找,如果无则报错
    // 执行 npm install 只会根据自己的包中pageage.json 下载依赖插件模块，插件的依赖模块，要cd到其目录中，在执行npm install
    // 每个插件包，会在pageage.json 中字段 "main": "Gruntfile.js"说明该字段的主入口。每个包也会有自己的node_modules，依赖其他插件（模块）
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadNpmTasks('grunt-webpage-scaffold');
    grunt.loadNpmTasks('grunt-contrib-copy') ;

    //定义任务
    grunt.registerTask('default', ['less', 'browserify', 'uglify', 'copy']) ;

};
