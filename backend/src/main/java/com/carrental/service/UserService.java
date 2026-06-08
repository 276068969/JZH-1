package com.carrental.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.carrental.entity.User;

public interface UserService extends IService<User> {
    User register(String username, String password, String email, String phone, String userType);
    String login(String username, String password);
}
