# Composition API

## ref

## reactive

## ref 和 reactive 定义响应式数据

- 在Vue2中，定义响应式数据都是在data中，而vue3中对响应式数据的声明，可以使用ref和reactive，reactive的参数必须是对象，而ref可以处理基本数据类型和对象；
- ref在js中读值需要加.value，可以使用isRef判断是否是ref对象，reactive不能改变本身，但可以改变内部的值；
- 在模板中访问从setup返回的ref时，会自动解包，因此无需再在模板中为它写.value；
- vue3区分ref和reactive的原因是Proxy无法对原始值进行代理，所以需要一层对象作为包裹。