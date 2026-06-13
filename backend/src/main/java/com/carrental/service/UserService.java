package com.carrental.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.carrental.dto.RegisterRequestDTO;
import com.carrental.dto.RegisterResponseVO;
import com.carrental.entity.User;

public interface UserService extends IService<User> {
    @Deprecated
    User register(String username, String password, String email, String phone, String userType);

    RegisterResponseVO register(RegisterRequestDTO request);

    String login(String username, String password);
}
