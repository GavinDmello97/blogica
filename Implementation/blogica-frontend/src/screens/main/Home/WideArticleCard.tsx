import React from "react";
import { ArticleCardProps } from "../../../config/types";
import Generic from "../../../components/generic/GenericComponents";
import moment from "moment";
import { Link, useNavigate } from "react-router-dom";

const WideArticleCard = (cardProps: ArticleCardProps) => {
  const { article, index } = cardProps;
  const navigate = useNavigate();

  return (
    <Link
      to={`/main/article/id/${article._id}`}
      state={{ articleId: article._id }}
      style={{ textDecoration: "none", color: "black" }}
    >
      <div className=" noselect d-flex mb-2">
        <div className=" noselect col-8 pe-4">
          <div className=" noselect d-flex flex-row align-items-center">
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/main/author/id/${article.author._id}`);
              }}
            >
              <Generic.Avatar
                image_url={article.author.image_url}
                fullname="Gavin D'mello"
                size={25}
              />
            </div>
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/main/author/id/${article.author._id}`);
              }}
              className=" noselect ms-2 text-primary"
              style={{ fontWeight: "bold", fontSize: 14 }}
            >
              {`${article.author.firstname} ${article.author.lastname}`}
            </span>
          </div>
          <h6
            className=" noselect mt-2 col-12 "
            style={{
              fontWeight: "bold",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: "2",
              WebkitBoxOrient: "vertical",
            }}
          >
            {article.title}
          </h6>
          <span
            className=" noselect mb-3  col-12"
            style={{ fontSize: 14, color: "#555" }}
          >
            {moment(article.createdAt).fromNow()}
          </span>
        </div>
        <div className=" noselect col-4 row align-items-center justify-content-center">
          <div
            onClick={() => {}}
            className=" noselect img-fluid"
            style={{
              backgroundImage: `url(${article.image_url})`,
              aspectRatio: "1/1",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
        </div>
      </div>
    </Link>
  );
};

export default WideArticleCard;
