package com.carrental.dto;

import lombok.Data;

@Data
public class RegisterRequestDTO {
    private String username;
    private String password;
    private String confirmPassword;
    private String email;
    private String phone;
    private String userType;

    private String idCard;
    private String licenseNumber;

    private String companyName;
    private String creditCode;
    private String legalPersonName;
    private String legalPersonIdCard;
}
